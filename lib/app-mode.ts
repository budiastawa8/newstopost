export type AppMode = "carousel" | "studio";

const STORAGE_KEY = "newstopost.appMode";

export function loadStoredAppMode(): AppMode {
  if (typeof window === "undefined") return "carousel";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "carousel" || value === "studio") return value;
  } catch {
    // ignore
  }
  return "carousel";
}

export function saveStoredAppMode(mode: AppMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
