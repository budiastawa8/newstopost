import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SummarizeResult } from "@/lib/types";

const MAX_TEXT_CHARS = 12_000;
const REQUIRED_POINTS = 3;
const MIN_HASHTAGS = 5;
const MAX_HASHTAGS = 12;
const MAX_ATTEMPTS_PER_MODEL = 3;

/** Primary + fallback saat model sedang overload (503 / high demand) */
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL?.trim(),
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
].filter((id, index, arr): id is string => Boolean(id) && arr.indexOf(id) === index);

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    throw Object.assign(
      new Error("GEMINI_API_KEY belum dikonfigurasi di environment."),
      { status: 503 }
    );
  }
  return key.trim();
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(candidate) as unknown;
}

function normalizeHashtag(tag: string): string | null {
  const cleaned = tag.trim().replace(/\s+/g, "");
  if (!cleaned) return null;
  const withHash = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  if (!/^#[\p{L}\p{N}_]+$/u.test(withHash)) return null;
  return withHash;
}

function validateSummarizePayload(value: unknown): SummarizeResult {
  if (!value || typeof value !== "object") {
    throw new Error("Respons Gemini bukan objek JSON.");
  }

  const record = value as {
    points?: unknown;
    caption?: unknown;
    hashtags?: unknown;
  };

  if (!Array.isArray(record.points)) {
    throw new Error("Field points tidak ditemukan.");
  }

  const points = record.points
    .filter((p): p is string => typeof p === "string")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .slice(0, REQUIRED_POINTS);

  if (points.length !== REQUIRED_POINTS) {
    throw new Error(`Jumlah paragraf ringkasan harus tepat ${REQUIRED_POINTS}.`);
  }

  const caption =
    typeof record.caption === "string" ? record.caption.trim() : "";
  if (caption.length < 20) {
    throw new Error("Caption terlalu pendek atau kosong.");
  }

  if (!Array.isArray(record.hashtags)) {
    throw new Error("Field hashtags tidak ditemukan.");
  }

  const hashtags = record.hashtags
    .filter((tag): tag is string => typeof tag === "string")
    .map(normalizeHashtag)
    .filter((tag): tag is string => Boolean(tag));

  const unique = [...new Set(hashtags)].slice(0, MAX_HASHTAGS);
  if (unique.length < MIN_HASHTAGS) {
    throw new Error(`Hashtag minimal ${MIN_HASHTAGS} buah.`);
  }

  return { points, caption, hashtags: unique };
}

function isRetryableGeminiError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return /503|429|high demand|unavailable|resource.?exhausted|try again|overloaded|quota/i.test(
    message
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildPrompt(truncated: string, title?: string): string {
  return [
    "Kamu adalah editor media sosial untuk carousel berita Instagram & Facebook.",
    "Dari teks berita, buat:",
    "1) TEPAT 3 paragraf ringkasan pendek Bahasa Indonesia untuk slide carousel.",
    "   - Tiap paragraf maksimal 2 kalimat padat (~40–70 kata), faktual, tanpa emoji/numbering/markdown.",
    "2) Satu caption siap posting untuk Instagram/Facebook (Bahasa Indonesia).",
    "   - 2–4 kalimat menarik, jelas, boleh 1–2 emoji relevan (jangan berlebihan).",
    "   - Sertakan ajakan singkat (mis. swipe / simak carousel).",
    "   - Jangan cantumkan hashtag di dalam caption (hashtag terpisah).",
    "3) 5–12 hashtag relevan dengan topik artikel (campuran spesifik + umum).",
    "   - Format: diawali #, tanpa spasi, Bahasa Indonesia/Inggris yang wajar.",
    "",
    'Output HANYA JSON murni: {"points":["p1","p2","p3"],"caption":"...","hashtags":["#a","#b"]}',
    title ? `Judul: ${title}` : "",
    "Teks berita:",
    truncated,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateWithModel(
  genAI: GoogleGenerativeAI,
  modelId: string,
  prompt: string
): Promise<SummarizeResult> {
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      temperature: 0.45,
      responseMimeType: "application/json",
    },
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const parsed = extractJsonObject(raw);
      return validateSummarizePayload(parsed);
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === MAX_ATTEMPTS_PER_MODEL) {
        throw error;
      }
      // Backoff: 1s, 2s, 4s (+ jitter kecil)
      const delay = 1000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 400);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function summarizeArticle(
  text: string,
  title?: string
): Promise<SummarizeResult> {
  const apiKey = getApiKey();
  const truncated = text.slice(0, MAX_TEXT_CHARS);
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(truncated, title);

  let lastError: unknown;

  for (const modelId of MODEL_CANDIDATES) {
    try {
      return await generateWithModel(genAI, modelId, prompt);
    } catch (error) {
      lastError = error;
      // Coba model berikutnya hanya jika overload/rate-limit
      if (!isRetryableGeminiError(error)) {
        break;
      }
    }
  }

  if ((lastError as { status?: number })?.status) {
    throw lastError;
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : "Gagal memanggil Gemini.";

  if (/API key|permission|401|403/i.test(message)) {
    throw Object.assign(new Error("Autentikasi Gemini gagal."), {
      status: 401,
    });
  }

  if (isRetryableGeminiError(lastError)) {
    throw Object.assign(
      new Error(
        "Layanan Gemini sedang padat (503). Sistem sudah mencoba ulang & model cadangan. Silakan generate lagi sebentar."
      ),
      { status: 503 }
    );
  }

  throw Object.assign(
    new Error(
      message.includes("paragraf") ||
        message.includes("poin") ||
        message.includes("Caption") ||
        message.includes("Hashtag") ||
        message.includes("JSON")
        ? `Respons Gemini tidak valid: ${message}`
        : "Gagal merangkum berita dengan Gemini."
    ),
    { status: 502 }
  );
}
