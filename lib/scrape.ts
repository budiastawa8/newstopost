import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { unstable_cache } from "next/cache";
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
  scrapeViaRss,
  scrapeViaWordPressApi,
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

function isCloudflareChallenge(html: string, status: number): boolean {
  if (status === 403 || status === 503) return true;
  const lower = html.toLowerCase();
  return (
    lower.includes("just a moment...") ||
    lower.includes("cf-browser-verification") ||
    lower.includes("cdn-cgi/challenge-platform") ||
    (lower.includes("cloudflare") && lower.includes("enable javascript"))
  );
}

function parseWithReadability(html: string, url: string): ScrapeResult {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
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

  // 2) Fallback HTML + Readability
  const htmlHeaders = {
    ...BROWSER_HEADERS,
    Referer: "https://www.google.com/",
  };

  let htmlResult: { status: number; text: string; contentType: string | null };

  try {
    htmlResult = await fetchText(url, htmlHeaders);
  } catch (error) {
    const again = await scrapeViaFastSources(url).catch(() => null);
    if (again) return again;
    if (error instanceof Error && error.name === "AbortError") {
      throw statusError("Timeout saat mengambil halaman berita.", 502);
    }
    throw statusError("Gagal mengambil halaman berita.", 502);
  }

  const blocked = isCloudflareChallenge(htmlResult.text, htmlResult.status);

  if (!htmlResult.status || htmlResult.status >= 400 || blocked) {
    // HTML kena CF — coba lagi RSS dengan hint link alternate dari HTML challenge? biasanya tidak berguna.
    // Tetap retry fast sources sekali lagi (kadang race).
    const again = await scrapeViaFastSources(url, htmlResult.text).catch(
      () => null
    );
    if (again) return again;

    throw statusError(
      `Gagal mengambil halaman (HTTP ${htmlResult.status || "error"}). Situs mungkin dilindungi bot (Cloudflare).`,
      502
    );
  }

  try {
    return parseWithReadability(htmlResult.text, url);
  } catch (error) {
    const again = await scrapeViaFastSources(url, htmlResult.text).catch(
      () => null
    );
    if (again) return again;

    if ((error as { status?: number }).status) {
      throw error;
    }
    throw statusError(
      error instanceof Error
        ? error.message
        : "Gagal mem-parse halaman berita.",
      500
    );
  }
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

  try {
    const result = await scrapeWithNextCache(key);
    setCachedScrape(key, result);
    return { ...result, cacheHit: false };
  } catch (error) {
    // Jika Next data cache gagal/aneh, fallback langsung
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
