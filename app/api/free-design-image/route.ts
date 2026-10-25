import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { generateBackgroundImage } from "@/lib/cloudflare-image";
import type {
  ApiErrorBody,
  AspectRatio,
  FreeDesignImageRequestBody,
  FreeDesignImageResult,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Generate gambar Workers AI sering 10–40s. */
export const maxDuration = 60;

const VALID_ASPECTS = new Set<AspectRatio>([
  "1080x1350",
  "1080x1080",
  "1080x1920",
]);

export async function POST(
  request: Request
): Promise<NextResponse<FreeDesignImageResult | ApiErrorBody>> {
  try {
    let body: FreeDesignImageRequestBody;

    try {
      body = (await request.json()) as FreeDesignImageRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Body JSON tidak valid." },
        { status: 400 }
      );
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const aspect = body.aspect;

    if (!prompt) {
      return NextResponse.json(
        { error: "Field prompt wajib diisi." },
        { status: 400 }
      );
    }

    if (!VALID_ASPECTS.has(aspect)) {
      return NextResponse.json(
        { error: "Rasio tidak valid." },
        { status: 400 }
      );
    }

    const result = await generateBackgroundImage({ prompt, aspect });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
