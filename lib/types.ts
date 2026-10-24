import type { ParagraphCount } from "@/lib/paragraph-count";

export type AspectRatio = "1080x1350" | "1080x1080" | "1080x1920";
export type { ParagraphCount };

export type ScrapeSource = "wordpress" | "rss" | "html";

export interface ScrapeResult {
  title: string;
  content: string;
  mainImage: string | null;
  images: string[];
  sourceUrl: string;
  /** Sumber pengambilan konten */
  fetchedVia?: ScrapeSource;
  /** true jika diambil dari cache (memory / data cache) */
  cacheHit?: boolean;
}

export interface SummarizeResult {
  points: string[];
  /** Caption siap posting untuk Instagram/Facebook */
  caption: string;
  /** Hashtag terkait (dengan #) */
  hashtags: string[];
  /** 1–3 potongan dari judul untuk di-highlight di cover/story */
  titleHighlights: string[];
}

export interface CoverSlideModel {
  kind: "cover";
  title: string;
  imageUrl: string | null;
  titleHighlights?: string[];
}

export interface SummarySlideModel {
  kind: "summary";
  points: string[];
}

export interface PhotoSlideModel {
  kind: "photo";
  imageUrl: string;
  caption?: string;
}

export type SlideModel = CoverSlideModel | SummarySlideModel | PhotoSlideModel;

export interface ScrapeRequestBody {
  url: string;
}

export interface SummarizeRequestBody {
  text: string;
  title?: string;
  /** Jumlah paragraf ringkasan di slide (2–4) */
  paragraphCount?: ParagraphCount;
}

/** Tone copy untuk Desain bebas (Generate AI). */
export type FreeDesignCopyTone =
  | "natural"
  | "formal"
  | "santai"
  | "promo";

export interface FreeDesignCopyRequestBody {
  brief: string;
  category: "quote" | "poster" | "promo";
  designName?: string;
  tone?: FreeDesignCopyTone;
}

export interface FreeDesignCopyResult {
  headline: string;
  subtext: string;
}

export interface ApiErrorBody {
  error: string;
}

export interface AspectSize {
  width: number;
  height: number;
}
