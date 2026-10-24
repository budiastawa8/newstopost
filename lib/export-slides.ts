import JSZip from "jszip";

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  if (!base64) {
    throw new Error("Data URL PNG tidak valid.");
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function slugifyTitle(title: string | null | undefined): string {
  if (!title) return "carousel";
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "carousel";
}

export async function zipPngDataUrls(
  dataUrls: string[],
  options?: {
    title?: string | null;
    generationKey?: string | null;
    /** PNG Story 9:16 opsional */
    storyDataUrl?: string | null;
  }
): Promise<void> {
  if (dataUrls.length === 0 && !options?.storyDataUrl) {
    throw new Error("Tidak ada slide untuk diunduh.");
  }

  const zip = new JSZip();
  const stamp = options?.generationKey
    ? options.generationKey.replace(/\W/g, "").slice(-8)
    : String(Date.now()).slice(-8);
  const folderName = `newstopost-${slugifyTitle(options?.title)}-${stamp}`;
  const folder = zip.folder(folderName);
  if (!folder) {
    throw new Error("Gagal membuat folder di ZIP.");
  }

  dataUrls.forEach((dataUrl, i) => {
    const index = String(i + 1).padStart(2, "0");
    folder.file(`slide-${index}.png`, dataUrlToUint8Array(dataUrl));
  });

  if (options?.storyDataUrl) {
    folder.file("story.png", dataUrlToUint8Array(options.storyDataUrl));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${folderName}.zip`);
}
