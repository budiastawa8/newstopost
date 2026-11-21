import type { ScrapeResult, SlideModel } from "@/lib/types";

/** Samakan URL WordPress yang beda ukuran crop saja. */
export function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    const path = parsed.pathname.replace(/-\d+x\d+(?=\.[a-z]+$)/i, "");
    return `${parsed.origin}${path}`;
  } catch {
    return url;
  }
}

export function sameImageUrl(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalizeImageUrl(a) === normalizeImageUrl(b);
}

/** Pool foto artikel: mainImage + images, tanpa duplikat. */
export function collectImagePool(
  scrape: Pick<ScrapeResult, "mainImage" | "images">
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  function add(url: string | null | undefined) {
    if (!url?.trim()) return;
    const key = normalizeImageUrl(url);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(url);
  }

  add(scrape.mainImage);
  for (const img of scrape.images) add(img);
  return out;
}

export function getCoverImageUrl(slides: SlideModel[]): string | null {
  const cover = slides.find((s) => s.kind === "cover");
  return cover && cover.kind === "cover" ? cover.imageUrl : null;
}

export function getPhotoSlideUrls(slides: SlideModel[]): string[] {
  return slides.filter((s) => s.kind === "photo").map((s) => s.imageUrl);
}

function photoSlideIndexes(slides: SlideModel[]): number[] {
  const indexes: number[] = [];
  slides.forEach((slide, index) => {
    if (slide.kind === "photo") indexes.push(index);
  });
  return indexes;
}

/**
 * Ganti foto cover. Jika URL sudah dipakai di slide foto, tukar dengan cover lama.
 */
export function setCoverImage(
  slides: SlideModel[],
  nextImageUrl: string
): SlideModel[] {
  const coverIdx = slides.findIndex((s) => s.kind === "cover");
  if (coverIdx < 0) return slides;

  const cover = slides[coverIdx];
  if (cover.kind !== "cover") return slides;
  if (sameImageUrl(cover.imageUrl, nextImageUrl)) return slides;

  const prevUrl = cover.imageUrl;
  const photoIdx = slides.findIndex(
    (s) => s.kind === "photo" && sameImageUrl(s.imageUrl, nextImageUrl)
  );

  return slides.map((slide, index) => {
    if (index === coverIdx && slide.kind === "cover") {
      return { ...slide, imageUrl: nextImageUrl };
    }
    if (
      index === photoIdx &&
      slide.kind === "photo" &&
      prevUrl &&
      prevUrl.trim()
    ) {
      return { ...slide, imageUrl: prevUrl };
    }
    return slide;
  });
}

/**
 * Pindahkan slide foto ke atas/bawah di antara sesama slide foto.
 * `photoOrdinal` = indeks 0-based di antara slide kind "photo" saja.
 */
export function movePhotoSlide(
  slides: SlideModel[],
  photoOrdinal: number,
  direction: -1 | 1
): SlideModel[] {
  const indexes = photoSlideIndexes(slides);
  const targetOrdinal = photoOrdinal + direction;
  if (
    photoOrdinal < 0 ||
    photoOrdinal >= indexes.length ||
    targetOrdinal < 0 ||
    targetOrdinal >= indexes.length
  ) {
    return slides;
  }

  const fromIdx = indexes[photoOrdinal];
  const toIdx = indexes[targetOrdinal];
  const next = [...slides];
  const tmp = next[fromIdx];
  next[fromIdx] = next[toIdx];
  next[toIdx] = tmp;
  return next;
}

/**
 * Ganti gambar pada slide foto ke-n.
 * Jika URL sudah dipakai cover atau slide foto lain, tukar.
 */
export function setPhotoSlideImage(
  slides: SlideModel[],
  photoOrdinal: number,
  nextImageUrl: string
): SlideModel[] {
  const indexes = photoSlideIndexes(slides);
  if (photoOrdinal < 0 || photoOrdinal >= indexes.length) return slides;

  const targetIdx = indexes[photoOrdinal];
  const target = slides[targetIdx];
  if (target.kind !== "photo") return slides;
  if (sameImageUrl(target.imageUrl, nextImageUrl)) return slides;

  const prevUrl = target.imageUrl;
  const coverIdx = slides.findIndex(
    (s) => s.kind === "cover" && sameImageUrl(s.imageUrl, nextImageUrl)
  );
  const otherPhotoIdx = slides.findIndex(
    (s, i) =>
      i !== targetIdx &&
      s.kind === "photo" &&
      sameImageUrl(s.imageUrl, nextImageUrl)
  );

  return slides.map((slide, index) => {
    if (index === targetIdx && slide.kind === "photo") {
      return { ...slide, imageUrl: nextImageUrl };
    }
    if (index === coverIdx && slide.kind === "cover") {
      return { ...slide, imageUrl: prevUrl };
    }
    if (index === otherPhotoIdx && slide.kind === "photo") {
      return { ...slide, imageUrl: prevUrl };
    }
    return slide;
  });
}

export function unusedImages(
  pool: string[],
  slides: SlideModel[]
): string[] {
  const used = new Set<string>();
  for (const slide of slides) {
    if (slide.kind === "cover" && slide.imageUrl) {
      used.add(normalizeImageUrl(slide.imageUrl));
    }
    if (slide.kind === "photo") {
      used.add(normalizeImageUrl(slide.imageUrl));
    }
  }
  return pool.filter((url) => !used.has(normalizeImageUrl(url)));
}
