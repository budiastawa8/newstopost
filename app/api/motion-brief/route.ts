import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { summarizeArticle } from "@/lib/gemini";
import { buildMotionBrief, type MotionAspect, type MotionStyle, type MotionTone } from "@/lib/motion-brief";
import { normalizeParagraphCount } from "@/lib/paragraph-count";
import { scrapeArticle } from "@/lib/scrape";
import type { ApiErrorBody } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type MotionBriefRequestBody = {
  url?: string;
  title?: string;
  text?: string;
  channel?: string;
  cta?: string;
  durationSec?: number;
  aspect?: MotionAspect;
  style?: MotionStyle;
  tone?: MotionTone;
};

function isAspect(value: unknown): value is MotionAspect {
  return value === "9:16" || value === "1:1" || value === "16:9" || value === "4:5";
}

function isStyle(value: unknown): value is MotionStyle {
  return value === "explainer" || value === "ticker" || value === "minimal";
}

function isTone(value: unknown): value is MotionTone {
  return value === "netral" || value === "santai" || value === "tegas";
}

export async function POST(request: Request) {
  try {
    let body: MotionBriefRequestBody;
    try {
      body = (await request.json()) as MotionBriefRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Body JSON tidak valid." } satisfies ApiErrorBody,
        { status: 400 }
      );
    }

    const url = typeof body.url === "string" ? body.url.trim() : "";
    let title = typeof body.title === "string" ? body.title.trim() : "";
    let text = typeof body.text === "string" ? body.text.trim() : "";
    let sourceUrl = url;
    let mainImage: string | null = null;
    let images: string[] = [];

    if (url) {
      const scraped = await scrapeArticle(url);
      title = scraped.title || title;
      text = scraped.content || text;
      sourceUrl = scraped.sourceUrl || url;
      mainImage = scraped.mainImage;
      images = scraped.images || [];
    }

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Konten berita kosong. Isi URL yang valid atau tempel teks berita.",
        } satisfies ApiErrorBody,
        { status: 400 }
      );
    }

    const summary = await summarizeArticle(
      text,
      title || undefined,
      normalizeParagraphCount(3)
    );

    const brief = buildMotionBrief({
      title: title || summary.points[0] || "Update berita",
      points: summary.points,
      sourceUrl,
      channel: body.channel,
      cta: body.cta,
      durationSec: body.durationSec,
      aspect: isAspect(body.aspect) ? body.aspect : "9:16",
      style: isStyle(body.style) ? body.style : "explainer",
      tone: isTone(body.tone) ? body.tone : "netral",
      mainImage,
      images,
    });

    return NextResponse.json({
      brief,
      summary,
      sourceTitle: title,
      sourceUrl,
      imageCount: brief.images.length,
    });
  } catch (error) {
    return jsonError(error);
  }
}
