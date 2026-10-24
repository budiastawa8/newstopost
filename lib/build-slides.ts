import type { ScrapeResult, SlideModel, SummarizeResult } from "@/lib/types";

const MAX_TOTAL_SLIDES = 5;

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    // Abaikan perbedaan ukuran WordPress (-1024x576 vs full)
    const path = parsed.pathname.replace(/-\d+x\d+(?=\.[a-z]+$)/i, "");
    return `${parsed.origin}${path}`;
  } catch {
    return url;
  }
}

export function buildSlides(
  scrape: ScrapeResult,
  summarize: SummarizeResult
): SlideModel[] {
  const slides: SlideModel[] = [
    {
      kind: "cover",
      title: scrape.title,
      imageUrl: scrape.mainImage,
    },
    {
      kind: "summary",
      points: summarize.points,
    },
  ];

  const mainNormalized = scrape.mainImage
    ? normalizeUrl(scrape.mainImage)
    : null;

  const seen = new Set<string>();
  if (mainNormalized) seen.add(mainNormalized);

  const extras: string[] = [];
  for (const img of scrape.images) {
    const normalized = normalizeUrl(img);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    extras.push(img);
  }

  const remainingSlots = MAX_TOTAL_SLIDES - slides.length;
  for (let i = 0; i < Math.min(extras.length, remainingSlots); i += 1) {
    slides.push({
      kind: "photo",
      imageUrl: extras[i],
      caption: "Dokumentasi",
    });
  }

  // Jangan mengisi slide foto dengan mainImage (sama seperti cover)
  return slides;
}
