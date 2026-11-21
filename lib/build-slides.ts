import { normalizeImageUrl } from "@/lib/slide-photos";
import type { ScrapeResult, SlideModel, SummarizeResult } from "@/lib/types";

const MAX_TOTAL_SLIDES = 5;

export function buildSlides(
  scrape: ScrapeResult,
  summarize: SummarizeResult
): SlideModel[] {
  const slides: SlideModel[] = [
    {
      kind: "cover",
      title: scrape.title,
      imageUrl: scrape.mainImage,
      titleHighlights: [],
    },
    {
      kind: "summary",
      points: summarize.points,
    },
  ];

  const mainNormalized = scrape.mainImage
    ? normalizeImageUrl(scrape.mainImage)
    : null;

  const seen = new Set<string>();
  if (mainNormalized) seen.add(mainNormalized);

  const extras: string[] = [];
  for (const img of scrape.images) {
    const normalized = normalizeImageUrl(img);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    extras.push(img);
  }

  const remainingSlots = MAX_TOTAL_SLIDES - slides.length;
  for (let i = 0; i < Math.min(extras.length, remainingSlots); i += 1) {
    slides.push({
      kind: "photo",
      imageUrl: extras[i],
    });
  }

  // Jangan mengisi slide foto dengan mainImage (sama seperti cover)
  return slides;
}
