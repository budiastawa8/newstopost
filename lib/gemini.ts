import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DEFAULT_PARAGRAPH_COUNT,
  normalizeParagraphCount,
  type ParagraphCount,
} from "@/lib/paragraph-count";
import { isVercel, SUMMARIZE_BUDGET_MS } from "@/lib/runtime";
import type {
  FreeDesignCopyResult,
  FreeDesignCopyTone,
  MotionCopyResult,
  MotionNarrationLine,
  SummarizeResult,
} from "@/lib/types";

const MAX_TEXT_CHARS = isVercel ? 8_000 : 12_000;
const MIN_HASHTAGS = 5;
const MAX_HASHTAGS = 12;
/** Di Vercel retry panjang = 504 FUNCTION_INVOCATION_TIMEOUT. */
const MAX_ATTEMPTS_PER_MODEL = isVercel ? 2 : 3;
const PER_CALL_TIMEOUT_MS = isVercel ? 18_000 : 45_000;

/**
 * Urutan model: lite dulu (lebih stabil saat high-demand), lalu 3.6.
 * Hindari 3.8 sebagai default (sering overload → retry lama).
 * Override dengan GEMINI_MODEL di env (tetap dicoba pertama).
 */
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL?.trim(),
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  ...(isVercel ? [] : ["gemini-3.8-flash"]),
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

function validateSummarizePayload(
  value: unknown,
  paragraphCount: ParagraphCount
): SummarizeResult {
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
    .slice(0, paragraphCount);

  if (points.length !== paragraphCount) {
    throw new Error(
      `Jumlah paragraf ringkasan harus tepat ${paragraphCount}.`
    );
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

  // Highlight judul dipilih manual di UI (bukan Gemini)
  return { points, caption, hashtags: unique, titleHighlights: [] };
}

function isRetryableGeminiError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status === 429 || status === 503 || status === 504) return true;

  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return /503|429|high demand|unavailable|resource.?exhausted|try again|overloaded|quota|timeout|aborted/i.test(
    message
  );
}

/**
 * GoogleGenerativeAIFetchError juga punya `.status` numerik.
 * Jangan rethrow mentah ke client — map ke pesan app yang jelas.
 */
function throwMappedGeminiFailure(
  lastError: unknown,
  options: {
    overloadedMessage: string;
    invalidMessage: string;
  }
): never {
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
    throw Object.assign(new Error(options.overloadedMessage), {
      status: 503,
    });
  }

  const looksLikeValidation =
    /paragraf|poin|Caption|Hashtag|Headline|JSON|Respons Gemini|hook|facts|outro|\.vo|onScreen|menggantung/i.test(
      message
    );

  throw Object.assign(
    new Error(
      looksLikeValidation
        ? `Respons Gemini tidak valid: ${message}`
        : options.invalidMessage
    ),
    { status: 502 }
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

function buildPrompt(
  truncated: string,
  paragraphCount: ParagraphCount,
  title?: string
): string {
  const pointsExample = Array.from(
    { length: paragraphCount },
    (_, i) => `"p${i + 1}"`
  ).join(",");

  return [
    "Kamu adalah editor media sosial untuk carousel berita Instagram & Facebook.",
    "Dari teks berita, buat:",
    `1) TEPAT ${paragraphCount} paragraf ringkasan pendek Bahasa Indonesia untuk slide carousel.`,
    "   - Tiap paragraf maksimal 2 kalimat padat (~40–70 kata), faktual, tanpa emoji/numbering/markdown.",
    "2) Satu caption siap posting untuk Instagram/Facebook (Bahasa Indonesia).",
    "   - 2–4 kalimat menarik, jelas, boleh 1–2 emoji relevan (jangan berlebihan).",
    "   - Sertakan ajakan singkat (mis. swipe / simak carousel).",
    "   - Jangan cantumkan hashtag di dalam caption (hashtag terpisah).",
    "3) 5–12 hashtag relevan dengan topik artikel (campuran spesifik + umum).",
    "   - Format: diawali #, tanpa spasi, Bahasa Indonesia/Inggris yang wajar.",
    "",
    `Output HANYA JSON murni: {"points":[${pointsExample}],"caption":"...","hashtags":["#a","#b"]}`,
    `Array points HARUS berisi tepat ${paragraphCount} string.`,
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
  prompt: string,
  paragraphCount: ParagraphCount,
  deadline: number
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
    const left = remainingMs(deadline);
    if (left < 2_000) {
      throw Object.assign(
        new Error(
          "Waktu proses Gemini habis (batas Vercel). Coba lagi, atau set GEMINI_MODEL=gemini-3.5-flash-lite."
        ),
        { status: 504 }
      );
    }

    try {
      const result = await model.generateContent(prompt, {
        timeout: Math.min(PER_CALL_TIMEOUT_MS, left - 500),
      });
      const raw = result.response.text();
      const parsed = extractJsonObject(raw);
      return validateSummarizePayload(parsed, paragraphCount);
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === MAX_ATTEMPTS_PER_MODEL) {
        throw error;
      }
      const delay = Math.min(
        remainingMs(deadline) - 1_500,
        400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200)
      );
      if (delay < 200) throw error;
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function summarizeArticle(
  text: string,
  title?: string,
  paragraphCountInput: number = DEFAULT_PARAGRAPH_COUNT
): Promise<SummarizeResult> {
  const paragraphCount = normalizeParagraphCount(paragraphCountInput);
  const apiKey = getApiKey();
  const truncated = text.slice(0, MAX_TEXT_CHARS);
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(truncated, paragraphCount, title);
  const deadline = Date.now() + SUMMARIZE_BUDGET_MS;

  let lastError: unknown;

  for (const modelId of MODEL_CANDIDATES) {
    if (remainingMs(deadline) < 2_000) break;
    try {
      return await generateWithModel(
        genAI,
        modelId,
        prompt,
        paragraphCount,
        deadline
      );
    } catch (error) {
      lastError = error;
      if ((error as { status?: number }).status === 504) {
        throw error;
      }
      // Coba model berikutnya hanya jika overload/rate-limit/timeout
      if (!isRetryableGeminiError(error)) {
        break;
      }
    }
  }

  throwMappedGeminiFailure(lastError, {
    overloadedMessage:
      "Layanan Gemini sedang padat atau lambat. Coba lagi sebentar, atau set GEMINI_MODEL=gemini-3.5-flash-lite.",
    invalidMessage: "Gagal merangkum berita dengan Gemini.",
  });
}

type MotionCopyTone = "netral" | "santai" | "tegas";

function normalizeMotionTone(value: unknown): MotionCopyTone {
  if (value === "santai" || value === "tegas" || value === "netral") {
    return value;
  }
  return "netral";
}

function cleanNarrationLine(
  value: unknown,
  field: string
): MotionNarrationLine {
  if (!value || typeof value !== "object") {
    throw new Error(`Field ${field} tidak valid.`);
  }
  const record = value as { vo?: unknown; onScreen?: unknown };
  const vo = typeof record.vo === "string" ? record.vo.replace(/\s+/g, " ").trim() : "";
  const onScreen =
    typeof record.onScreen === "string"
      ? record.onScreen.replace(/\s+/g, " ").trim()
      : "";
  if (vo.length < 8) {
    throw new Error(`Field ${field}.vo terlalu pendek.`);
  }
  if (onScreen.length < 4) {
    throw new Error(`Field ${field}.onScreen terlalu pendek.`);
  }
  if (/…|\.\.\.$/.test(vo) || /,$/.test(vo)) {
    throw new Error(`Field ${field}.vo terasa menggantung / tidak lengkap.`);
  }
  const voClosed = /[.!?]$/.test(vo) ? vo : `${vo}.`;
  return { vo: voClosed, onScreen };
}

function validateMotionCopyPayload(
  value: unknown,
  factCount: ParagraphCount
): MotionCopyResult {
  const summary = validateSummarizePayload(value, factCount);
  if (!value || typeof value !== "object") {
    throw new Error("Respons Gemini bukan objek JSON.");
  }
  const record = value as {
    hook?: unknown;
    facts?: unknown;
    outro?: unknown;
  };
  const hook = cleanNarrationLine(record.hook, "hook");
  if (!Array.isArray(record.facts)) {
    throw new Error("Field facts tidak ditemukan.");
  }
  const facts = record.facts
    .slice(0, factCount)
    .map((item, i) => cleanNarrationLine(item, `facts[${i}]`));
  if (facts.length !== factCount) {
    throw new Error(`Field facts harus berisi tepat ${factCount} item.`);
  }
  const outro = cleanNarrationLine(record.outro, "outro");
  return {
    ...summary,
    hook,
    facts,
    outro,
  };
}

function buildMotionCopyPrompt(input: {
  truncated: string;
  title?: string;
  tone: MotionCopyTone;
  cta: string;
  durationSec: number;
  factCount: number;
}): string {
  const { truncated, title, tone, cta, durationSec, factCount } = input;
  const factsExample = Array.from(
    { length: factCount },
    () => `{"vo":"...","onScreen":"..."}`
  ).join(",");
  const pointsExample = Array.from(
    { length: factCount },
    (_, i) => `"ringkasan ${i + 1}"`
  ).join(",");

  return [
    "Kamu adalah penulis naskah motion graphic berita + editor media sosial.",
    "Buat SEMUA teks berikut dalam Bahasa Indonesia dari artikel yang diberikan.",
    "",
    "A) Ringkasan & caption sosial (untuk panel caption IG/FB):",
    `1) TEPAT ${factCount} poin ringkasan faktual (tiap poin 1–2 kalimat lengkap, ~20–40 kata).`,
    "2) Satu caption siap posting IG/FB (2–4 kalimat, boleh 1–2 emoji, tanpa hashtag di dalam caption).",
    "3) 5–12 hashtag relevan (diawali #).",
    "",
    "B) Naskah motion graphic (untuk ElevenLabs + kartu video) — WAJIB kalimat lengkap, jangan potong di tengah klausa:",
    "4) hook:",
    "   - onScreen = judul berita PERSIS seperti yang diberikan (jangan dipotong).",
    "   - vo = 1–2 kalimat bicara natural yang menyampaikan inti judul (boleh parafrase agar enak dibaca keras). Akhiri dengan titik.",
    `5) facts: tepat ${factCount} item. Tiap item:`,
    "   - vo = 1–2 kalimat lengkap siap voiceover (~12–28 kata). Faktual, selesai, tidak menggantung.",
    "   - onScreen = frasa kartu padat (~6–14 kata) dengan makna utuh (bukan potongan klausa).",
    "6) outro:",
    `   - vo = ajakan natural berbasis CTA user: "${cta}" (1 kalimat lengkap).`,
    "   - onScreen = CTA singkat untuk kartu akhir.",
    "",
    `Tone naskah: ${tone}.`,
    `Target durasi video sekitar ${durationSec} detik — jaga VO ringkas agar muat.`,
    "Jangan pakai markdown, numbering, atau elipsis (…) di akhir kalimat VO.",
    "",
    `Output HANYA JSON murni: {"points":[${pointsExample}],"caption":"...","hashtags":["#a","#b"],"hook":{"vo":"...","onScreen":"..."},"facts":[${factsExample}],"outro":{"vo":"...","onScreen":"..."}}`,
    title ? `Judul berita (pakai PERSIS di hook.onScreen): ${title}` : "",
    "Teks berita:",
    truncated,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateMotionCopyWithModel(
  genAI: GoogleGenerativeAI,
  modelId: string,
  prompt: string,
  factCount: ParagraphCount,
  deadline: number
): Promise<MotionCopyResult> {
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
    const left = remainingMs(deadline);
    if (left < 2_000) {
      throw Object.assign(
        new Error(
          "Waktu proses Gemini habis (batas Vercel). Coba lagi, atau set GEMINI_MODEL=gemini-3.5-flash-lite."
        ),
        { status: 504 }
      );
    }

    try {
      const result = await model.generateContent(prompt, {
        timeout: Math.min(PER_CALL_TIMEOUT_MS, left - 500),
      });
      const raw = result.response.text();
      const parsed = extractJsonObject(raw);
      return validateMotionCopyPayload(parsed, factCount);
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === MAX_ATTEMPTS_PER_MODEL) {
        throw error;
      }
      const delay = Math.min(
        remainingMs(deadline) - 1_500,
        400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200)
      );
      if (delay < 200) throw error;
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function generateMotionCopy(input: {
  text: string;
  title?: string;
  tone?: MotionCopyTone | string;
  cta?: string;
  durationSec?: number;
  factCount?: number;
}): Promise<MotionCopyResult> {
  const text = input.text.trim();
  if (!text) {
    throw Object.assign(new Error("Teks berita kosong."), { status: 400 });
  }

  const factCount = normalizeParagraphCount(input.factCount ?? 3);
  const tone = normalizeMotionTone(input.tone);
  const cta =
    (input.cta || "Ikuti untuk update berikutnya").trim() ||
    "Ikuti untuk update berikutnya";
  const durationSec = Math.max(8, Number(input.durationSec) || 15);
  const title = input.title?.trim() || undefined;
  const truncated = text.slice(0, MAX_TEXT_CHARS);
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildMotionCopyPrompt({
    truncated,
    title,
    tone,
    cta,
    durationSec,
    factCount,
  });
  const deadline = Date.now() + SUMMARIZE_BUDGET_MS;

  let lastError: unknown;

  for (const modelId of MODEL_CANDIDATES) {
    if (remainingMs(deadline) < 2_000) break;
    try {
      const copy = await generateMotionCopyWithModel(
        genAI,
        modelId,
        prompt,
        factCount,
        deadline
      );
      if (title) {
        copy.hook = {
          ...copy.hook,
          onScreen: title,
        };
      }
      return copy;
    } catch (error) {
      lastError = error;
      if ((error as { status?: number }).status === 504) {
        throw error;
      }
      if ((error as { status?: number }).status === 400) {
        throw error;
      }
      if (!isRetryableGeminiError(error)) {
        break;
      }
    }
  }

  throwMappedGeminiFailure(lastError, {
    overloadedMessage:
      "Layanan Gemini sedang padat atau lambat. Coba lagi sebentar, atau set GEMINI_MODEL=gemini-3.5-flash-lite.",
    invalidMessage: "Gagal membuat naskah Motion Graphic dengan Gemini.",
  });
}

const FREE_COPY_BRIEF_MAX = 500;

function normalizeFreeCopyTone(value: unknown): FreeDesignCopyTone {
  if (
    value === "formal" ||
    value === "santai" ||
    value === "promo" ||
    value === "natural"
  ) {
    return value;
  }
  return "natural";
}

function validateFreeDesignCopyPayload(value: unknown): FreeDesignCopyResult {
  if (!value || typeof value !== "object") {
    throw new Error("Respons Gemini bukan objek JSON.");
  }
  const record = value as { headline?: unknown; subtext?: unknown };
  const headline =
    typeof record.headline === "string" ? record.headline.trim() : "";
  if (headline.length < 4) {
    throw new Error("Headline terlalu pendek atau kosong.");
  }
  const subtext =
    typeof record.subtext === "string" ? record.subtext.trim() : "";
  return {
    headline: headline.slice(0, 160),
    subtext: subtext.slice(0, 120),
  };
}

function buildFreeDesignCopyPrompt(input: {
  brief: string;
  category: "quote" | "poster" | "promo";
  designName?: string;
  tone: FreeDesignCopyTone;
}): string {
  const categoryGuide =
    input.category === "quote"
      ? [
          "Kategori QUOTE: headline = 1 kalimat quote/inspiratif (boleh tanpa tanda kutip).",
          "Maksimal ~90 karakter. subtext = kredit/atribusi atau konteks singkat (boleh kosong).",
        ].join(" ")
      : input.category === "promo"
        ? [
            "Kategori PROMO: headline = penawaran kuat & jelas (diskon/manfaat).",
            "Maksimal ~60 karakter. subtext = CTA atau detail singkat (mis. periode, cara klaim).",
          ].join(" ")
        : [
            "Kategori POSTER: headline = judul impactful singkat.",
            "Maksimal ~70 karakter. subtext = 1 baris pendukung (boleh kosong).",
          ].join(" ");

  const toneGuide =
    input.tone === "formal"
      ? "Tone: formal, sopan, profesional."
      : input.tone === "santai"
        ? "Tone: santai, ramah, conversational."
        : input.tone === "promo"
          ? "Tone: salesy tapi tidak berlebihan, ajakan jelas."
          : "Tone: natural, jelas, enak dibaca.";

  return [
    "Kamu copywriter media sosial untuk slide Instagram/Facebook (Bahasa Indonesia).",
    "Dari brief pengguna, buat teks siap tempel ke template desain.",
    categoryGuide,
    toneGuide,
    "Tanpa emoji, tanpa markdown, tanpa hashtag.",
    'Output HANYA JSON murni: {"headline":"...","subtext":"..."}',
    input.designName ? `Nama desain: ${input.designName}` : "",
    `Brief:\n${input.brief}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateFreeCopyWithModel(
  genAI: GoogleGenerativeAI,
  modelId: string,
  prompt: string,
  deadline: number
): Promise<FreeDesignCopyResult> {
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
    const left = remainingMs(deadline);
    if (left < 2_000) {
      throw Object.assign(
        new Error(
          "Waktu proses Gemini habis (batas Vercel). Coba lagi sebentar."
        ),
        { status: 504 }
      );
    }

    try {
      const result = await model.generateContent(prompt, {
        timeout: Math.min(PER_CALL_TIMEOUT_MS, left - 500),
      });
      const raw = result.response.text();
      const parsed = extractJsonObject(raw);
      return validateFreeDesignCopyPayload(parsed);
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === MAX_ATTEMPTS_PER_MODEL) {
        throw error;
      }
      const delay = Math.min(
        remainingMs(deadline) - 1_500,
        400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200)
      );
      if (delay < 200) throw error;
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function generateFreeDesignCopy(input: {
  brief: string;
  category: "quote" | "poster" | "promo";
  designName?: string;
  tone?: FreeDesignCopyTone;
}): Promise<FreeDesignCopyResult> {
  const brief = input.brief.trim().slice(0, FREE_COPY_BRIEF_MAX);
  if (brief.length < 8) {
    throw Object.assign(
      new Error("Brief minimal 8 karakter."),
      { status: 400 }
    );
  }

  const tone = normalizeFreeCopyTone(input.tone);
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildFreeDesignCopyPrompt({
    brief,
    category: input.category,
    designName: input.designName?.trim() || undefined,
    tone,
  });
  const deadline = Date.now() + SUMMARIZE_BUDGET_MS;

  let lastError: unknown;

  for (const modelId of MODEL_CANDIDATES) {
    if (remainingMs(deadline) < 2_000) break;
    try {
      return await generateFreeCopyWithModel(genAI, modelId, prompt, deadline);
    } catch (error) {
      lastError = error;
      if ((error as { status?: number }).status === 504) {
        throw error;
      }
      if ((error as { status?: number }).status === 400) {
        throw error;
      }
      if (!isRetryableGeminiError(error)) {
        break;
      }
    }
  }

  throwMappedGeminiFailure(lastError, {
    overloadedMessage:
      "Layanan Gemini sedang padat atau lambat. Coba lagi sebentar.",
    invalidMessage: "Gagal membuat copy desain dengan Gemini.",
  });
}
