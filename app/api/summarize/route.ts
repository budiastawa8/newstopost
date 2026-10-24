import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { summarizeArticle } from "@/lib/gemini";
import { normalizeParagraphCount } from "@/lib/paragraph-count";
import type {
  ApiErrorBody,
  SummarizeRequestBody,
  SummarizeResult,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Gemini + retry/fallback model bisa melebihi batas default. */
export const maxDuration = 60;

export async function POST(
  request: Request
): Promise<NextResponse<SummarizeResult | ApiErrorBody>> {
  try {
    let body: SummarizeRequestBody;

    try {
      body = (await request.json()) as SummarizeRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Body JSON tidak valid." },
        { status: 400 }
      );
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const title =
      typeof body.title === "string" ? body.title.trim() : undefined;
    const paragraphCount = normalizeParagraphCount(body.paragraphCount);

    if (!text) {
      return NextResponse.json(
        { error: "Field text wajib diisi." },
        { status: 400 }
      );
    }

    const result = await summarizeArticle(text, title, paragraphCount);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
