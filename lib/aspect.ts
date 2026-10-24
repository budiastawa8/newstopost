import type { AspectRatio, AspectSize } from "@/lib/types";

/** Instagram / Facebook Story */
export const STORY_SIZE: AspectSize = { width: 1080, height: 1920 };

export function getAspectSize(ratio: AspectRatio): AspectSize {
  if (ratio === "1080x1080") {
    return { width: 1080, height: 1080 };
  }
  if (ratio === "1080x1920") {
    return { ...STORY_SIZE };
  }
  return { width: 1080, height: 1350 };
}

export function getStorySize(): AspectSize {
  return STORY_SIZE;
}

export function proxiedImageUrl(
  remoteUrl: string | null | undefined,
  cacheKey?: string
): string | null {
  if (!remoteUrl) return null;

  // Sudah lokal / data URL — jangan diproxy lagi
  if (
    remoteUrl.startsWith("data:") ||
    remoteUrl.startsWith("blob:") ||
    remoteUrl.startsWith("/")
  ) {
    return remoteUrl;
  }

  const params = new URLSearchParams({ url: remoteUrl });
  if (cacheKey) {
    params.set("v", cacheKey);
  }
  return `/api/image-proxy?${params.toString()}`;
}

export async function fetchImageAsDataUrl(
  remoteUrl: string,
  cacheKey?: string
): Promise<string> {
  if (remoteUrl.startsWith("data:")) return remoteUrl;

  const src = proxiedImageUrl(remoteUrl, cacheKey);
  if (!src) {
    throw new Error("URL gambar tidak valid.");
  }

  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Gagal memuat gambar (HTTP ${response.status}).`);
  }
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Gagal membaca gambar."));
    };
    reader.onerror = () => reject(new Error("Gagal membaca gambar."));
    reader.readAsDataURL(blob);
  });
}
