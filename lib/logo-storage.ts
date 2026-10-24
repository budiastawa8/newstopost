const STORAGE_KEY = "newstopost.brandLogo";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export const DEFAULT_LOGO_SRC = "/logo.svg";

export function isAllowedLogoFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Format logo harus PNG, JPG, WEBP, atau SVG.";
  }
  if (file.size > MAX_BYTES) {
    return "Ukuran logo maksimal 2 MB.";
  }
  return null;
}

export function readLogoFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Gagal membaca file logo."));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file logo."));
    reader.readAsDataURL(file);
  });
}

export function loadStoredLogo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value || !value.startsWith("data:image/")) return null;
    return value;
  } catch {
    return null;
  }
}

export function saveStoredLogo(dataUrl: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, dataUrl);
}

export function clearStoredLogo(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function resolveLogoSrc(uploaded: string | null): string {
  return uploaded || DEFAULT_LOGO_SRC;
}
