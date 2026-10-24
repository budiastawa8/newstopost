import type { ScrapeResult } from "@/lib/types";

const TTL_MS = 30 * 60 * 1000; // 30 menit
const MAX_ENTRIES = 200;

interface CacheEntry {
  expiresAt: number;
  value: ScrapeResult;
}

const memoryCache = new Map<string, CacheEntry>();

export function normalizeCacheKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    // Seragamkan trailing slash (kecuali root)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.href;
  } catch {
    return url.trim();
  }
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) memoryCache.delete(key);
  }
  if (memoryCache.size <= MAX_ENTRIES) return;

  const ordered = [...memoryCache.entries()].sort(
    (a, b) => a[1].expiresAt - b[1].expiresAt
  );
  const removeCount = memoryCache.size - MAX_ENTRIES;
  for (let i = 0; i < removeCount; i += 1) {
    memoryCache.delete(ordered[i][0]);
  }
}

export function getCachedScrape(url: string): ScrapeResult | null {
  const key = normalizeCacheKey(url);
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return {
    ...entry.value,
    cacheHit: true,
  };
}

export function setCachedScrape(url: string, value: ScrapeResult): void {
  pruneExpired();
  const key = normalizeCacheKey(url);
  const { cacheHit: _ignored, ...rest } = value;
  memoryCache.set(key, {
    expiresAt: Date.now() + TTL_MS,
    value: { ...rest, cacheHit: false },
  });
}

export const SCRAPE_CACHE_TTL_SECONDS = Math.floor(TTL_MS / 1000);
