import { NextResponse } from "next/server";
import {
  createSessionToken,
  isAuthConfigured,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/team-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "APP_PASSWORD belum dikonfigurasi. Set di environment lalu restart/redeploy.",
      },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password wajib diisi." }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
