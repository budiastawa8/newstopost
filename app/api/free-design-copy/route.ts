import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { generateFreeDesignCopy } from "@/lib/gemini";
import type {
  ApiErrorBody,
  FreeDesignCopyRequestBody,
  FreeDesignCopyResult,
  FreeDesignCopyTone,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_CATEGORIES = new Set(["quote", "poster", "promo"]);
const VALID_TONES = new Set<FreeDesignCopyTone>([
  "natural",
  "formal",
  "santai",
  "promo",
]);

export async function POST(
  request: Request
): Promise<NextResponse<FreeDesignCopyResult | ApiErrorBody>> {
  try {
    let body: FreeDesignCopyRequestBody;

    try {
      body = (await request.json()) as FreeDesignCopyRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Body JSON tidak valid." },
        { status: 400 }
      );
    }

    const brief = typeof body.brief === "string" ? body.brief.trim() : "";
    const category = body.category;
    const designName =
      typeof body.designName === "string" ? body.designName.trim() : undefined;
    const tone =
      typeof body.tone === "string" && VALID_TONES.has(body.tone)
        ? body.tone
        : "natural";

    if (!brief) {
      return NextResponse.json(
        { error: "Field brief wajib diisi." },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: "Kategori desain tidak valid." },
        { status: 400 }
      );
    }

    const result = await generateFreeDesignCopy({
      brief,
      category,
      designName,
      tone,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
