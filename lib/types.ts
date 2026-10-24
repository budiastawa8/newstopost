import type { ParagraphCount } from "@/lib/paragraph-count";

export type AspectRatio = "1080x1350" | "1080x1080";
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
}

export interface CoverSlideModel {
  kind: "cover";
  title: string;
  imageUrl: string | null;
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

export interface ApiErrorBody {
  error: string;
}

export interface AspectSize {
  width: number;
  height: number;
}
