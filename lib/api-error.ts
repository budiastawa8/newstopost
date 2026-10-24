import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/lib/types";

export function jsonError(
  error: unknown,
  fallbackStatus = 500
): NextResponse<ApiErrorBody> {
  const status =
    typeof (error as { status?: number }).status === "number"
      ? (error as { status: number }).status
      : fallbackStatus;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Terjadi kesalahan server.";

  console.error("[api-error]", { status, message, error });

  return NextResponse.json({ error: message }, { status });
}
