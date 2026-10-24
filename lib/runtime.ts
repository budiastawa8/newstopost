/** Deteksi runtime Vercel untuk budget waktu lebih ketat. */
export const isVercel = Boolean(process.env.VERCEL);

/** Sisakan buffer sebelum hard limit fungsi (Hobby/Pro maxDuration). */
export const SCRAPE_BUDGET_MS = isVercel ? 25_000 : 45_000;
export const SUMMARIZE_BUDGET_MS = isVercel ? 45_000 : 90_000;

export const FETCH_FAST_MS = isVercel ? 4_000 : 6_000;
export const FETCH_HTML_MS = isVercel ? 8_000 : 15_000;
