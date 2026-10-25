const STORAGE_KEY = "newstopost.carouselFontScale";

export const DEFAULT_FONT_SCALE = 1;
export const MIN_FONT_SCALE = 0.7;
export const MAX_FONT_SCALE = 1.45;

export function normalizeFontScale(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_FONT_SCALE;
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, n));
}

/** Skala ukuran px desain (dibulatkan). */
export function scalePx(base: number, fontScale: number = DEFAULT_FONT_SCALE): number {
  return Math.round(base * normalizeFontScale(fontScale));
}

export function loadStoredFontScale(): number {
  if (typeof window === "undefined") return DEFAULT_FONT_SCALE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_FONT_SCALE;
    return normalizeFontScale(Number(raw));
  } catch {
    return DEFAULT_FONT_SCALE;
  }
}

export function saveStoredFontScale(value: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    String(normalizeFontScale(value))
  );
}
