export type ParagraphCount = 2 | 3 | 4;

export const PARAGRAPH_COUNT_OPTIONS: ParagraphCount[] = [2, 3, 4];
export const DEFAULT_PARAGRAPH_COUNT: ParagraphCount = 3;

const STORAGE_KEY = "newstopost.paragraphCount";

export function normalizeParagraphCount(value: unknown): ParagraphCount {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 2 || n === 3 || n === 4) return n;
  return DEFAULT_PARAGRAPH_COUNT;
}

export function loadStoredParagraphCount(): ParagraphCount {
  if (typeof window === "undefined") return DEFAULT_PARAGRAPH_COUNT;
  try {
    return normalizeParagraphCount(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_PARAGRAPH_COUNT;
  }
}

export function saveStoredParagraphCount(count: ParagraphCount): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(count));
}
