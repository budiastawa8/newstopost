import { NextResponse, type NextRequest } from "next/server";
import {
  isAuthConfigured,
  isAuthRequired,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/team-auth";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname === "/~offline") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/serwist/")) return true;
  if (pathname === "/manifest.webmanifest" || pathname === "/manifest") {
    return true;
  }
  if (pathname === "/icon.png" || pathname === "/apple-icon.png") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    // Sudah login → jangan stuck di /login
    if (pathname === "/login" && isAuthConfigured()) {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (await verifySessionToken(token)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  if (!isAuthRequired()) {
    return NextResponse.next();
  }

  if (!isAuthConfigured()) {
    // Vercel tanpa APP_PASSWORD: kunci total sampai admin set env
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error:
            "APP_PASSWORD belum diset di Vercel. Tambahkan di Environment Variables lalu Redeploy.",
        },
        { status: 503 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("setup", "1");
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Sesi tidak valid. Login dulu di halaman utama." },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
