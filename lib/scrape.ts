import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { unstable_cache } from "next/cache";
import { isVercel } from "@/lib/runtime";
import {
  getCachedScrape,
  normalizeCacheKey,
  SCRAPE_CACHE_TTL_SECONDS,
  setCachedScrape,
} from "@/lib/scrape-cache";
import {
  BROWSER_HEADERS,
  extractImages,
  extractMainImage,
  fetchText,
  scrapeViaJina,
  scrapeViaRss,
  scrapeViaWordPressApi,
  type FetchTextResult,
} from "@/lib/scrape-sources";
import type { ScrapeResult } from "@/lib/types";

interface StatusError extends Error {
  status: number;
}

function statusError(message: string, status: number): StatusError {
  return Object.assign(new Error(message), { status });
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Deteksi Challenge Page sungguhan — bukan sekadar skrip JSD Cloudflare.
 * `/cdn-cgi/challenge-platform` sering di-inject ke HTML artikel normal
 * (JavaScript Detections), jadi TIDAK dipakai sebagai sinyal block.
 * Sinyal andal: header `cf-mitigated: challenge` (docs Cloudflare).
 */
function isCloudflareChallenge(result: FetchTextResult): boolean {
  if (result.cfMitigated?.toLowerCase() === "challenge") return true;

  const lower = result.text.toLowerCase();
  const titleMatch = lower.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = (titleMatch?.[1] || "").trim();
  const isInterstitialTitle =
    title.includes("just a moment") ||
    title.includes("attention required") ||
    title.includes("um momentinho") ||
    title === "cloudflare";

  // Interstitial challenge: judul challenge + body relatif pendek
  if (isInterstitialTitle && result.text.length < 80_000) return true;

  if (
    lower.includes("cf-browser-verification") &&
    result.text.length < 80_000
  ) {
    return true;
  }

  // 403/503 saja belum tentu CF; gabungkan dengan sinyal interstitial
  if (
    (result.status === 403 || result.status === 503) &&
    (isInterstitialTitle ||
      lower.includes("enable javascript and cookies") ||
      lower.includes("checking your browser"))
  ) {
    return true;
  }

  return false;
}

async function scrapeViaFallbacks(
  url: string,
  htmlHint?: string
): Promise<ScrapeResult | null> {
  const again = await scrapeViaFastSources(url, htmlHint).catch(() => null);
  if (again) return again;
  return scrapeViaJina(url).catch(() => null);
}

function parseWithReadability(html: string, url: string): ScrapeResult {
  // linkedom: ringan & aman di Vercel (jsdom sering crash ERR_REQUIRE_ESM di serverless)
  const { document } = parseHTML(html);
  try {
    // Bantu resolusi URL relatif bila parser mendukung location
    Object.defineProperty(document, "URL", { value: url, configurable: true });
  } catch {
    // ignore
  }
  const reader = new Readability(document as unknown as Document);
  const article = reader.parse();

  if (!article || (!article.title && !article.textContent)) {
    throw statusError(
      "Konten berita tidak dapat dibaca dari URL tersebut.",
      422
    );
  }

  const title = (article.title || "").trim() || "Tanpa judul";
  const content = (article.textContent || "").replace(/\s+/g, " ").trim();

  if (content.length < 40) {
    throw statusError(
      "Isi artikel terlalu pendek atau tidak ditemukan.",
      422
    );
  }

  const mainImage = extractMainImage(html, url);
  const images = extractImages(html, url, mainImage);

  return {
    title,
    content,
    mainImage,
    images,
    sourceUrl: url,
    fetchedVia: "html",
  };
}

/**
 * Fast path: WordPress REST + RSS secara paralel (sering lolos Cloudflare).
 */
async function scrapeViaFastSources(
  url: string,
  htmlHint?: string
): Promise<ScrapeResult | null> {
  const [wp, rss] = await Promise.all([
    scrapeViaWordPressApi(url).catch(() => null),
    scrapeViaRss(url, htmlHint).catch(() => null),
  ]);
  return wp ?? rss ?? null;
}

async function scrapeArticleFresh(url: string): Promise<ScrapeResult> {
  if (!isValidHttpUrl(url)) {
    throw statusError("URL tidak valid. Gunakan http atau https.", 400);
  }

  // 1) Coba WP/RSS dulu (lebih cepat & sering bypass CF)
  const fast = await scrapeViaFastSources(url);
  if (fast) return fast;

  // 2) Fallback HTML + Readability (satu kali — hindari retry berantai di Vercel)
  const htmlHeaders = {
    ...BROWSER_HEADERS,
    Referer: "https://www.google.com/",
  };

  let htmlResult: FetchTextResult;

  try {
    htmlResult = await fetchText(url, htmlHeaders);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw statusError(
        "Timeout saat mengambil halaman berita. Coba URL WordPress/RSS, atau generate lagi.",
        504
      );
    }
    throw statusError("Gagal mengambil halaman berita.", 502);
  }

  const blocked = isCloudflareChallenge(htmlResult);
  const httpOk =
    Boolean(htmlResult.status) &&
    htmlResult.status >= 200 &&
    htmlResult.status < 400;

  // HTTP OK + bukan challenge → parse dulu (hindari false positive JSD)
  if (httpOk && !blocked) {
    try {
      return parseWithReadability(htmlResult.text, url);
    } catch (error) {
      const fallback = await scrapeViaFallbacks(url, htmlResult.text);
      if (fallback) return fallback;
      if ((error as { status?: number }).status) throw error;
      throw statusError(
        error instanceof Error
          ? error.message
          : "Gagal mem-parse halaman berita.",
        500
      );
    }
  }

  const again = await scrapeViaFallbacks(url, htmlResult.text);
  if (again) return again;

  throw statusError(
    `Gagal mengambil halaman (HTTP ${htmlResult.status || "error"}). Situs mungkin dilindungi bot (Cloudflare). Coba tempel teks berita manual, atau URL WordPress.`,
    502
  );
}

async function scrapeWithNextCache(url: string): Promise<ScrapeResult> {
  const key = normalizeCacheKey(url);
  const cachedFn = unstable_cache(
    async () => scrapeArticleFresh(key),
    ["scrape-article", key],
    { revalidate: SCRAPE_CACHE_TTL_SECONDS }
  );
  return cachedFn();
}

export async function scrapeArticle(url: string): Promise<ScrapeResult> {
  if (!isValidHttpUrl(url)) {
    throw statusError("URL tidak valid. Gunakan http atau https.", 400);
  }

  const key = normalizeCacheKey(url);

  // Memory cache (instance hangat) — paling cepat
  const memoryHit = getCachedScrape(key);
  if (memoryHit) return memoryHit;

  // Di Vercel skip unstable_cache (overhead + perilaku dingin) — langsung fresh
  if (isVercel) {
    const fresh = await scrapeArticleFresh(key);
    setCachedScrape(key, fresh);
    return fresh;
  }

  try {
    const result = await scrapeWithNextCache(key);
    setCachedScrape(key, result);
    return { ...result, cacheHit: false };
  } catch (error) {
    if (
      error instanceof Error &&
      /cache|dynamic|static/i.test(error.message)
    ) {
      const fresh = await scrapeArticleFresh(key);
      setCachedScrape(key, fresh);
      return fresh;
    }
    throw error;
  }
}
