import { GoogleGenAI } from "@google/genai";
import { isVercel } from "@/lib/runtime";
import type { AspectRatio } from "@/lib/types";

/** Budget ketat di Vercel agar tidak kena FUNCTION_INVOCATION_TIMEOUT. */
export const IMAGE_GEN_BUDGET_MS = isVercel ? 50_000 : 90_000;

const PROMPT_MAX = 600;

/**
 * Imagen (generateImages) sudah di-shutdown Agustus 2026.
 * Gunakan Gemini native image (Nano Banana) via interactions API.
 */
const IMAGE_MODEL_CANDIDATES = [
  process.env.GEMINI_IMAGE_MODEL?.trim(),
  // Lite: cepat & murah — cocok Vercel; mendukung 4:5 / 9:16 / 1:1
  "gemini-3.1-flash-lite-image",
  "gemini-nano-banana-2.1",
  "gemini-3.1-flash-image",
].filter((id, index, arr): id is string => Boolean(id) && arr.indexOf(id) === index);

export type GeminiImageAspect = "1:1" | "4:5" | "9:16";

export function aspectRatioToGeminiImage(aspect: AspectRatio): GeminiImageAspect {
  if (aspect === "1080x1080") return "1:1";
  if (aspect === "1080x1920") return "9:16";
  return "4:5";
}

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

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

function isRetryableImageError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return /503|429|high demand|unavailable|resource.?exhausted|try again|overloaded|quota|timeout|aborted|DEADLINE/i.test(
    message
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildBackgroundPrompt(userPrompt: string): string {
  return [
    "Generate a photographic background image for a social media poster.",
    "Requirements:",
    "- No text, letters, numbers, logos, watermarks, captions, or UI chrome in the image.",
    "- Leave soft negative space (slightly darker or cleaner area) suitable for overlay typography.",
    "- Photorealistic or premium editorial look, high detail, natural lighting.",
    "- Vertical/square composition matching the requested aspect ratio.",
    "",
    `Scene brief: ${userPrompt}`,
  ].join("\n");
}

function extractImageDataUrl(interaction: {
  output_image?: { data?: string; mime_type?: string } | null;
  outputs?: unknown;
}): string {
  const direct = interaction.output_image;
  if (direct?.data) {
    const mime = direct.mime_type?.trim() || "image/jpeg";
    return `data:${mime};base64,${direct.data}`;
  }

  // Fallback: scan outputs array if SDK shape differs
  const outputs = interaction.outputs;
  if (Array.isArray(outputs)) {
    for (const item of outputs) {
      if (!item || typeof item !== "object") continue;
      const rec = item as {
        type?: string;
        data?: string;
        mime_type?: string;
        image?: { data?: string; mimeType?: string; mime_type?: string };
      };
      if (rec.type === "image" && typeof rec.data === "string") {
        const mime = rec.mime_type || "image/png";
        return `data:${mime};base64,${rec.data}`;
      }
      if (rec.image?.data) {
        const mime =
          rec.image.mime_type || rec.image.mimeType || "image/png";
        return `data:${mime};base64,${rec.image.data}`;
      }
    }
  }

  throw new Error("Respons Gemini tidak berisi gambar.");
}

async function generateWithModel(
  ai: GoogleGenAI,
  modelId: string,
  prompt: string,
  aspectRatio: GeminiImageAspect,
  deadline: number
): Promise<string> {
  const left = remainingMs(deadline);
  if (left < 3_000) {
    throw Object.assign(
      new Error(
        "Waktu proses gambar habis (batas Vercel). Coba lagi, atau set GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image."
      ),
      { status: 504 }
    );
  }

  const interaction = await ai.interactions.create({
    model: modelId,
    input: prompt,
    response_format: {
      type: "image",
      // Interactions API saat ini hanya menerima JPEG untuk image mime_type.
      mime_type: "image/jpeg",
      aspect_ratio: aspectRatio,
      // 1K: cukup untuk IG 1080px dan lebih cepat di Vercel
      image_size: "1K",
    },
  });

  return extractImageDataUrl(interaction as never);
}

export async function generateBackgroundImage(input: {
  prompt: string;
  aspect: AspectRatio;
}): Promise<{ imageDataUrl: string; model: string }> {
  const prompt = input.prompt.trim().slice(0, PROMPT_MAX);
  if (prompt.length < 8) {
    throw Object.assign(new Error("Prompt gambar minimal 8 karakter."), {
      status: 400,
    });
  }

  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = buildBackgroundPrompt(prompt);
  const aspectRatio = aspectRatioToGeminiImage(input.aspect);
  const deadline = Date.now() + IMAGE_GEN_BUDGET_MS;

  let lastError: unknown;

  for (const modelId of IMAGE_MODEL_CANDIDATES) {
    if (remainingMs(deadline) < 3_000) break;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const imageDataUrl = await generateWithModel(
          ai,
          modelId,
          fullPrompt,
          aspectRatio,
          deadline
        );
        return { imageDataUrl, model: modelId };
      } catch (error) {
        lastError = error;
        if ((error as { status?: number }).status === 504) throw error;
        if ((error as { status?: number }).status === 400) throw error;
        if (!isRetryableImageError(error) || attempt === 2) {
          break;
        }
        const delay = Math.min(
          remainingMs(deadline) - 2_000,
          600 * attempt + Math.floor(Math.random() * 200)
        );
        if (delay < 200) break;
        await sleep(delay);
      }
    }
  }

  if ((lastError as { status?: number })?.status) {
    throw lastError;
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : "Gagal memanggil Gemini image.";

  if (/API key|permission|401|403|PERMISSION/i.test(message)) {
    throw Object.assign(new Error("Autentikasi Gemini gagal."), {
      status: 401,
    });
  }

  if (/not found|404|NOT_FOUND|unsupported|does not support/i.test(message)) {
    throw Object.assign(
      new Error(
        "Model gambar Gemini tidak tersedia untuk API key ini. Cek akses image generation di Google AI Studio, atau set GEMINI_IMAGE_MODEL."
      ),
      { status: 502 }
    );
  }

  if (/limit:\s*0|Free Tier|upgrade your tier|rate.?limit/i.test(message)) {
    throw Object.assign(
      new Error(
        "API key ini tidak punya kuota generate gambar (Free Tier limit 0). Aktifkan billing / upgrade di Google AI Studio (ai.dev/rate-limit), lalu coba lagi."
      ),
      { status: 429 }
    );
  }

  if (isRetryableImageError(lastError)) {
    throw Object.assign(
      new Error(
        "Layanan Gemini image sedang padat atau lambat. Coba lagi sebentar."
      ),
      { status: 503 }
    );
  }

  throw Object.assign(
    new Error(
      message.includes("gambar") || message.includes("JSON")
        ? message
        : `Gagal generate latar: ${message}`
    ),
    { status: 502 }
  );
}
