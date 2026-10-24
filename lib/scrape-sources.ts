import * as cheerio from "cheerio";
import { FETCH_FAST_MS, FETCH_HTML_MS } from "@/lib/runtime";
import type { ScrapeResult } from "@/lib/types";

const SKIP_IMAGE_PATTERN =
  /logo|avatar|sprite|icon|emoji|pixel|tracking|1x1|spacer|badge|button|share|facebook|twitter|whatsapp|instagram|widgets\.js/i;

const MAX_IMAGES = 10;
export const FAST_TIMEOUT_MS = FETCH_FAST_MS;
export const HTML_TIMEOUT_MS = FETCH_HTML_MS;

export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "sec-ch-ua":
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

export function absolutize(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}

export function shouldSkipImage(src: string): boolean {
  return SKIP_IMAGE_PATTERN.test(src);
}

export function decodeHtmlEntities(value: string): string {
  return cheerio.load(`<textarea>${value}</textarea>`)("textarea").text();
}

export function extractImages(
  html: string,
  baseUrl: string,
  mainImage: string | null
): string[] {
  const $ = cheerio.load(html);
  const containers = [
    "article",
    "[itemprop='articleBody']",
    ".article-content",
    ".post-content",
    ".entry-content",
    "main",
  ];

  let scopeSelector = "body";
  for (const selector of containers) {
    if ($(selector).length > 0) {
      scopeSelector = selector;
      break;
    }
  }

  const seen = new Set<string>();
  const images: string[] = [];

  if (mainImage) seen.add(mainImage);

  $(scopeSelector).find("img").each((_, el) => {
    if (images.length >= MAX_IMAGES) return false;

    const raw =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("data-lazy-src") ||
      "";

    if (!raw || raw.startsWith("data:")) return;

    const absolute = absolutize(raw.trim(), baseUrl);
    if (!absolute || seen.has(absolute) || shouldSkipImage(absolute)) return;

    const width = Number($(el).attr("width") || 0);
    const height = Number($(el).attr("height") || 0);
    if ((width > 0 && width < 80) || (height > 0 && height < 80)) return;

    seen.add(absolute);
    images.push(absolute);
  });

  return images;
}

export function extractMainImage(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('meta[name="twitter:image:src"]').attr("content"),
    $("article img").first().attr("src"),
    $("img").first().attr("src"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const absolute = absolutize(candidate.trim(), baseUrl);
    if (absolute && !shouldSkipImage(absolute)) return absolute;
  }
  return null;
}

export async function fetchText(
  url: string,
  headers: Record<string, string>,
  timeoutMs = HTML_TIMEOUT_MS
): Promise<{ status: number; text: string; contentType: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      redirect: "follow",
    });
    const text = await response.text();
    return {
      status: response.status,
      text,
      contentType: response.headers.get("content-type"),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function slugFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, "");
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) return null;
    return decodeURIComponent(last);
  } catch {
    return null;
  }
}

function normalizeCompareUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.href.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

interface WpRenderedField {
  rendered?: string;
}

interface WpFeaturedMedia {
  source_url?: string;
}

interface WpPost {
  title?: WpRenderedField;
  content?: WpRenderedField;
  link?: string;
  _embedded?: {
    "wp:featuredmedia"?: WpFeaturedMedia[];
  };
}

export async function scrapeViaWordPressApi(
  pageUrl: string
): Promise<ScrapeResult | null> {
  const slug = slugFromUrl(pageUrl);
  if (!slug) return null;

  const origin = new URL(pageUrl).origin;
  const apiUrl = `${origin}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`;

  let result: Awaited<ReturnType<typeof fetchText>>;
  try {
    result = await fetchText(
      apiUrl,
      {
        "User-Agent": BROWSER_HEADERS["User-Agent"],
        Accept: "application/json",
        "Accept-Language": BROWSER_HEADERS["Accept-Language"],
      },
      FAST_TIMEOUT_MS
    );
  } catch {
    return null;
  }

  if (result.status !== 200 || !result.contentType?.includes("json")) {
    return null;
  }

  let posts: WpPost[];
  try {
    posts = JSON.parse(result.text) as WpPost[];
  } catch {
    return null;
  }

  if (!Array.isArray(posts) || posts.length === 0) return null;

  const post = posts[0];
  const title = decodeHtmlEntities((post.title?.rendered || "").trim());
  const contentHtml = post.content?.rendered || "";
  const $ = cheerio.load(`<div id="wp-content">${contentHtml}</div>`);
  const content = $("#wp-content").text().replace(/\s+/g, " ").trim();

  if (!title || content.length < 40) return null;

  const featured =
    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
  const mainImage = featured
    ? absolutize(featured, origin)
    : extractMainImage(contentHtml, origin);

  const images = extractImages(
    `<article>${contentHtml}</article>`,
    origin,
    mainImage
  );

  return {
    title,
    content,
    mainImage,
    images,
    sourceUrl: post.link || pageUrl,
    fetchedVia: "wordpress",
  };
}

function buildResultFromHtmlParts(
  title: string,
  contentHtml: string,
  pageUrl: string,
  origin: string,
  itemLink?: string
): ScrapeResult | null {
  const cleanTitle = decodeHtmlEntities(title).trim();
  const $ = cheerio.load(`<div id="feed-content">${contentHtml}</div>`);
  const content = $("#feed-content").text().replace(/\s+/g, " ").trim();
  if (!cleanTitle || content.length < 40) return null;

  const mainImage = extractMainImage(contentHtml, origin);
  const images = extractImages(
    `<article>${contentHtml}</article>`,
    origin,
    mainImage
  );

  return {
    title: cleanTitle,
    content,
    mainImage,
    images,
    sourceUrl: itemLink || pageUrl,
    fetchedVia: "rss",
  };
}

function matchFeedItemToPage(
  itemLink: string,
  itemGuid: string,
  pageUrl: string,
  slug: string | null
): boolean {
  const pageNorm = normalizeCompareUrl(pageUrl);
  if (itemLink && normalizeCompareUrl(itemLink) === pageNorm) return true;
  if (itemGuid && normalizeCompareUrl(itemGuid) === pageNorm) return true;
  if (slug) {
    const slugLower = slug.toLowerCase();
    if (itemLink.toLowerCase().includes(slugLower)) return true;
    if (itemGuid.toLowerCase().includes(slugLower)) return true;
  }
  return false;
}

function parseFeedXml(
  xml: string,
  pageUrl: string,
  origin: string
): ScrapeResult | null {
  const $ = cheerio.load(xml, { xmlMode: true });
  const slug = slugFromUrl(pageUrl);

  // RSS 2.0
  const rssItems = $("item").toArray();
  for (const item of rssItems) {
    const el = $(item);
    const link = (el.find("link").first().text() || "").trim();
    const guid = (el.find("guid").first().text() || "").trim();
    if (!matchFeedItemToPage(link, guid, pageUrl, slug)) continue;

    const title = el.find("title").first().text() || "";
    const contentHtml =
      el.find("content\\:encoded").first().html() ||
      el.find("encoded").first().html() ||
      el.find("description").first().html() ||
      el.find("description").first().text() ||
      "";

    const media =
      el.find("media\\:content").attr("url") ||
      el.find("enclosure").attr("url") ||
      null;

    const built = buildResultFromHtmlParts(
      title,
      contentHtml,
      pageUrl,
      origin,
      link || undefined
    );
    if (!built) continue;
    if (!built.mainImage && media) {
      built.mainImage = absolutize(media, origin);
    }
    return built;
  }

  // Atom
  const atomEntries = $("entry").toArray();
  for (const entry of atomEntries) {
    const el = $(entry);
    const link =
      el.find('link[rel="alternate"]').attr("href") ||
      el.find("link").attr("href") ||
      "";
    const id = (el.find("id").first().text() || "").trim();
    if (!matchFeedItemToPage(link, id, pageUrl, slug)) continue;

    const title = el.find("title").first().text() || "";
    const contentHtml =
      el.find("content").first().html() ||
      el.find("summary").first().html() ||
      el.find("content").first().text() ||
      "";

    const built = buildResultFromHtmlParts(
      title,
      contentHtml,
      pageUrl,
      origin,
      link || undefined
    );
    if (built) return built;
  }

  return null;
}

function discoverFeedUrlsFromHtml(html: string, origin: string): string[] {
  const $ = cheerio.load(html);
  const feeds: string[] = [];
  $('link[rel="alternate"]').each((_, el) => {
    const type = ($(el).attr("type") || "").toLowerCase();
    const href = $(el).attr("href");
    if (!href) return;
    if (
      type.includes("rss") ||
      type.includes("atom") ||
      type.includes("xml")
    ) {
      const absolute = absolutize(href, origin);
      if (absolute) feeds.push(absolute);
    }
  });
  return feeds;
}

export async function scrapeViaRss(
  pageUrl: string,
  htmlHint?: string
): Promise<ScrapeResult | null> {
  const origin = new URL(pageUrl).origin;
  const candidates = new Set<string>([
    `${origin}/feed`,
    `${origin}/feed/`,
    `${origin}/rss`,
    `${origin}/rss.xml`,
    `${origin}/atom.xml`,
    `${origin}/index.xml`,
  ]);

  if (htmlHint) {
    for (const feed of discoverFeedUrlsFromHtml(htmlHint, origin)) {
      candidates.add(feed);
    }
  }

  const attempts = [...candidates].map(async (feedUrl) => {
    try {
      const result = await fetchText(
        feedUrl,
        {
          "User-Agent": BROWSER_HEADERS["User-Agent"],
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
          "Accept-Language": BROWSER_HEADERS["Accept-Language"],
        },
        FAST_TIMEOUT_MS
      );
      if (result.status !== 200) return null;
      const ct = (result.contentType || "").toLowerCase();
      if (
        ct &&
        !ct.includes("xml") &&
        !ct.includes("rss") &&
        !ct.includes("atom") &&
        !ct.includes("text/plain") &&
        !ct.includes("html")
      ) {
        // tetap coba parse — beberapa server salah content-type
      }
      return parseFeedXml(result.text, pageUrl, origin);
    } catch {
      return null;
    }
  });

  const settled = await Promise.all(attempts);
  return settled.find((item): item is ScrapeResult => item !== null) ?? null;
}
