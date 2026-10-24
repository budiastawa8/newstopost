import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cek cepat apakah env deploy sudah terpasang (tanpa mengekspos secret). */
export async function GET() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  return NextResponse.json({
    ok: true,
    geminiKey: hasGeminiKey ? "configured" : "missing",
    model: process.env.GEMINI_MODEL?.trim() || "default",
  });
}
