import fs from "fs";
import path from "path";

const IMAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
};

function sanitizeId(id) {
  return String(id || "beat")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "beat";
}

function extFromUrlOrType(url, contentType) {
  const ct = String(contentType || "").toLowerCase();
  if (ct.includes("image/png")) return ".png";
  if (ct.includes("image/webp")) return ".webp";
  if (ct.includes("image/gif")) return ".gif";
  if (ct.includes("image/jpeg") || ct.includes("image/jpg")) return ".jpg";
  if (ct.includes("image/avif")) return ".avif";
  try {
    const pathname = new URL(url).pathname;
    const m = pathname.match(/\.(jpe?g|png|webp|gif|avif)$/i);
    if (m) {
      const ext = m[1].toLowerCase();
      return ext === "jpeg" ? ".jpg" : `.${ext}`;
    }
  } catch {
    // ignore
  }
  return ".jpg";
}

async function downloadOne(url, destPath) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      headers: IMAGE_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType && !contentType.includes("image/") && !contentType.includes("octet-stream")) {
      throw new Error(`bukan image (${contentType})`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 64) {
      throw new Error("file terlalu kecil");
    }
    fs.writeFileSync(destPath, buf);
    return { bytes: buf.length, contentType };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Download beat.imageUrl into public/media and set beat.imageSrc.
 * Failures are skipped so render still succeeds without photos.
 */
export async function attachLocalImages(brief, publicDir) {
  const next = structuredClone(brief);
  const mediaDir = path.join(publicDir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });

  const beats = Array.isArray(next.beats) ? next.beats : [];
  let ok = 0;
  let fail = 0;

  for (const beat of beats) {
    const remote = typeof beat.imageUrl === "string" ? beat.imageUrl.trim() : "";
    if (!remote) {
      beat.imageSrc = beat.imageSrc || null;
      continue;
    }

    const base = `beat-${sanitizeId(beat.id)}`;
    // Probe extension via HEAD when possible; fall back after GET.
    let destName = `${base}.jpg`;
    let destPath = path.join(mediaDir, destName);

    try {
      // Remove stale files for this beat id.
      for (const existing of fs.readdirSync(mediaDir)) {
        if (existing.startsWith(`${base}.`)) {
          fs.unlinkSync(path.join(mediaDir, existing));
        }
      }

      const tmpPath = path.join(mediaDir, `${base}.download`);
      const meta = await downloadOne(remote, tmpPath);
      const ext = extFromUrlOrType(remote, meta.contentType);
      destName = `${base}${ext}`;
      destPath = path.join(mediaDir, destName);
      fs.renameSync(tmpPath, destPath);
      beat.imageSrc = `media/${destName}`;
      ok += 1;
      console.log(`Foto OK  ${beat.id} → ${beat.imageSrc} (${meta.bytes} B)`);
    } catch (err) {
      fail += 1;
      beat.imageSrc = null;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Foto skip ${beat.id}: ${msg}`);
      try {
        const tmpPath = path.join(mediaDir, `${base}.download`);
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        // ignore
      }
    }
  }

  next.beats = beats;
  return { brief: next, ok, fail };
}

function extFromDataUrlMime(mime) {
  const ct = String(mime || "").toLowerCase();
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("gif")) return ".gif";
  if (ct.includes("svg")) return ".svg";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  return ".png";
}

/**
 * Tulis brief.logoDataUrl ke public/media/logo.* dan set brief.logoSrc.
 * Dipakai Remotion Img di beat outro.
 */
export function attachLocalLogo(brief, publicDir) {
  const next = structuredClone(brief);
  const dataUrl =
    typeof next.logoDataUrl === "string" ? next.logoDataUrl.trim() : "";
  if (!dataUrl.startsWith("data:image/")) {
    next.logoSrc = next.logoSrc || null;
    return { brief: next, ok: false };
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) {
    next.logoSrc = null;
    return { brief: next, ok: false };
  }

  const mediaDir = path.join(publicDir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });

  for (const existing of fs.readdirSync(mediaDir)) {
    if (existing.startsWith("logo.")) {
      fs.unlinkSync(path.join(mediaDir, existing));
    }
  }

  const ext = extFromDataUrlMime(match[1]);
  const destName = `logo${ext}`;
  const destPath = path.join(mediaDir, destName);
  try {
    fs.writeFileSync(destPath, Buffer.from(match[2], "base64"));
    next.logoSrc = `media/${destName}`;
    // Hapus data URL dari props agar file props.json tidak membengkak
    next.logoDataUrl = null;
    console.log(`Logo OK  → ${next.logoSrc}`);
    return { brief: next, ok: true };
  } catch (err) {
    next.logoSrc = null;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Logo skip: ${msg}`);
    return { brief: next, ok: false };
  }
}
