/** Auth tim kecil: satu password bersama (cookie bertanda tangan). */

export const SESSION_COOKIE = "ntp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 hari

function getPassword(): string | null {
  const value = process.env.APP_PASSWORD?.trim();
  return value ? value : null;
}

/** Secret untuk HMAC; boleh beda dari password lewat APP_AUTH_SECRET. */
function getSigningSecret(): string | null {
  const explicit = process.env.APP_AUTH_SECRET?.trim();
  if (explicit) return explicit;
  return getPassword();
}

export function isAuthConfigured(): boolean {
  return Boolean(getPassword() && getSigningSecret());
}

/** Di Vercel, password wajib. Lokal tanpa APP_PASSWORD = terbuka (dev). */
export function isAuthRequired(): boolean {
  if (isAuthConfigured()) return true;
  return Boolean(process.env.VERCEL);
}

export function getConfiguredPassword(): string | null {
  return getPassword();
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i += 1) {
    binary += String.fromCharCode(arr[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return toBase64Url(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  }
  return diff === 0;
}

export function verifyPassword(input: string): boolean {
  const expected = getPassword();
  if (!expected) return false;
  return timingSafeEqual(input, expected);
}

export async function createSessionToken(): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error("Auth secret tidak dikonfigurasi.");
  }
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `v1.${exp}`;
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expRaw, sig] = parts;
  if (version !== "v1" || !expRaw || !sig) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;

  const payload = `${version}.${expRaw}`;
  const expected = await hmacSign(secret, payload);
  if (!timingSafeEqual(sig, expected)) return false;

  // pastikan bentuk sig valid (decode)
  try {
    fromBase64Url(sig);
  } catch {
    return false;
  }

  return true;
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
