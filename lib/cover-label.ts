export const DEFAULT_COVER_LABEL = "Berita utama";
const STORAGE_KEY = "newstopost.coverLabel";
const MAX_LENGTH = 48;

export function normalizeCoverLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);
}

export function loadStoredCoverLabel(): string {
  if (typeof window === "undefined") return DEFAULT_COVER_LABEL;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_COVER_LABEL;
    return normalizeCoverLabel(raw);
  } catch {
    return DEFAULT_COVER_LABEL;
  }
}

export function saveStoredCoverLabel(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, normalizeCoverLabel(value));
}
