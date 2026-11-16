export type AppMode = "carousel" | "motion";

const STORAGE_KEY = "newstopost.appMode";

export function loadStoredAppMode(): AppMode {
  if (typeof window === "undefined") return "carousel";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "carousel" || value === "motion") return value;
    // Migrasi dari tab lama "Desain bebas"
    if (value === "studio") return "motion";
  } catch {
    // ignore
  }
  return "carousel";
}

export function saveStoredAppMode(mode: AppMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
