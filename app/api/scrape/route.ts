import { NextResponse } from "next/server";
import { scrapeArticle } from "@/lib/scrape";
import type { ApiErrorBody, ScrapeRequestBody, ScrapeResult } from "@/lib/types";

export const runtime = "nodejs";
/** Scrape + fallback WP/RSS bisa lebih dari 10 detik di Vercel. */
export const maxDuration = 60;

export async function POST(
  request: Request
): Promise<NextResponse<ScrapeResult | ApiErrorBody>> {
  try {
    let body: ScrapeRequestBody;

    try {
      body = (await request.json()) as ScrapeRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Body JSON tidak valid." },
        { status: 400 }
      );
    }

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json(
        { error: "Field url wajib diisi." },
        { status: 400 }
      );
    }

    const result = await scrapeArticle(url);
    return NextResponse.json(result);
  } catch (error) {
    const status =
      typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server.";

    return NextResponse.json({ error: message }, { status });
  }
}
