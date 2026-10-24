import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const FETCH_TIMEOUT_MS = 12_000;
const ALLOWED_CONTENT = /^image\//i;

function isAllowedRemoteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(
  request: Request
): Promise<NextResponse<ArrayBuffer | ApiErrorBody> | Response> {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("url")?.trim() ?? "";

    if (!target) {
      return NextResponse.json(
        { error: "Query url wajib diisi." },
        { status: 400 }
      );
    }

    if (!isAllowedRemoteUrl(target)) {
      return NextResponse.json(
        { error: "URL gambar harus http atau https." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const upstream = await fetch(target, {
        signal: controller.signal,
        headers: {
          Accept: "image/*,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      if (!upstream.ok) {
        return NextResponse.json(
          { error: `Gagal mengambil gambar (HTTP ${upstream.status}).` },
          { status: 502 }
        );
      }

      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      if (!ALLOWED_CONTENT.test(contentType)) {
        return NextResponse.json(
          { error: "URL tidak mengembalikan konten gambar." },
          { status: 422 }
        );
      }

      const buffer = await upstream.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Timeout saat mengambil gambar."
        : error instanceof Error
          ? error.message
          : "Gagal memproses proxy gambar.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
