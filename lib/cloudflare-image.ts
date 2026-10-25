import { isVercel } from "@/lib/runtime";
import type { AspectRatio } from "@/lib/types";

/** Budget ketat di Vercel. */
export const IMAGE_GEN_BUDGET_MS = isVercel ? 45_000 : 90_000;

const PROMPT_MAX = 600;

/** Model dengan width/height (cocok rasio IG). */
const SIZED_MODELS = [
  process.env.CLOUDFLARE_IMAGE_MODEL?.trim(),
  "@cf/bytedance/stable-diffusion-xl-lightning",
  "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  "@cf/lykon/dreamshaper-8-lcm",
].filter((id, index, arr): id is string => Boolean(id) && arr.indexOf(id) === index);

/** FLUX cepat (biasanya square) — fallback terakhir. */
const FLUX_MODEL = "@cf/black-forest-labs/flux-1-schnell";

function stripOuterQuotes(raw: string): string {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

/** Account ID Cloudflare = hex 32 karakter. */
function sanitizeAccountId(raw: string | undefined): string {
  if (!raw) return "";
  const value = stripOuterQuotes(raw);
  const hex = value.match(/\b([a-f0-9]{32})\b/i);
  if (hex?.[1]) return hex[1].toLowerCase();
  if (/^[a-f0-9]{32}$/i.test(value)) return value.toLowerCase();
  return "";
}

/**
 * Token Workers AI. User sering paste seluruh perintah curl verify —
 * ekstrak `cfut_…` jika ada; tolak nilai yang masih berisi spasi/curl.
 */
function sanitizeApiToken(raw: string | undefined): string {
  if (!raw) return "";
  const value = stripOuterQuotes(raw);
  const cfut = value.match(/\b(cfut_[A-Za-z0-9]+)\b/);
  if (cfut?.[1]) return cfut[1];
  const bearer = value.match(/\bBearer\s+([A-Za-z0-9_-]{20,})\b/i);
  if (bearer?.[1]) return bearer[1];
  const cleaned = value.replace(/^Bearer\s+/i, "").trim();
  if (/[\s\\]/.test(cleaned) || /curl\s/i.test(cleaned)) return "";
  if (/^cfut_[A-Za-z0-9]+$/.test(cleaned)) return cleaned;
  if (/^[A-Za-z0-9_-]{20,}$/.test(cleaned)) return cleaned;
  return "";
}

function getCredentials(): { accountId: string; apiToken: string } {
  const accountId = sanitizeAccountId(process.env.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = sanitizeApiToken(process.env.CLOUDFLARE_API_TOKEN);
  if (!accountId || !apiToken) {
    throw Object.assign(
      new Error(
        "CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN belum valid. Isi HANYA nilai mentah (Account ID hex + token cfut_…), jangan tempel perintah curl dari dashboard."
      ),
      { status: 503 }
    );
  }
  return { accountId, apiToken };
}

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryable(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const status = (error as { status?: number }).status;
  if (status === 429 || status === 503 || status === 504) return true;
  return /429|503|timeout|aborted|overloaded|rate.?limit|temporarily|capacity/i.test(
    message
  );
}

/** Ukuran native model (≤2048) mendekati rasio slide. */
export function aspectToImageSize(aspect: AspectRatio): {
  width: number;
  height: number;
} {
  if (aspect === "1080x1080") return { width: 1024, height: 1024 };
  if (aspect === "1080x1920") return { width: 768, height: 1344 };
  return { width: 832, height: 1040 }; // ≈4:5
}

function buildBackgroundPrompt(userPrompt: string, aspect: AspectRatio): string {
  const ratio =
    aspect === "1080x1080"
      ? "square 1:1"
      : aspect === "1080x1920"
        ? "vertical 9:16"
        : "portrait 4:5";

  return [
    "Photographic background for a social media poster,",
    `${ratio} composition,`,
    "no text, no letters, no logos, no watermarks, no UI,",
    "soft negative space for overlay typography,",
    "photorealistic, premium editorial lighting.",
    `Scene: ${userPrompt}`,
  ].join(" ");
}

function runUrl(accountId: string, model: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
}

async function parseImageResponse(
  response: Response,
  model: string
): Promise<string> {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("image/")) {
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.byteLength < 100) {
      throw new Error(`Respons gambar kosong dari ${model}.`);
    }
    const mime = contentType.split(";")[0]!.trim() || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  const raw = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(
      `Respons Cloudflare bukan JSON/gambar (${model}): ${raw.slice(0, 160)}`
    );
  }

  const record = json as {
    success?: boolean;
    errors?: Array<{ message?: string; code?: number }>;
    result?: unknown;
    image?: string;
  };

  if (record.success === false || (record.errors && record.errors.length > 0)) {
    const msg =
      record.errors?.map((e) => e.message).filter(Boolean).join("; ") ||
      "Permintaan Cloudflare gagal.";
    throw Object.assign(new Error(msg), { status: response.status || 502 });
  }

  const result = record.result;
  if (typeof result === "string" && result.length > 100) {
    return `data:image/jpeg;base64,${result}`;
  }
  if (result && typeof result === "object") {
    const img = (result as { image?: string }).image;
    if (typeof img === "string" && img.length > 100) {
      return `data:image/jpeg;base64,${img}`;
    }
  }
  if (typeof record.image === "string" && record.image.length > 100) {
    return `data:image/jpeg;base64,${record.image}`;
  }

  throw new Error(`Respons Cloudflare tidak berisi gambar (${model}).`);
}

async function callModel(options: {
  accountId: string;
  apiToken: string;
  model: string;
  prompt: string;
  width?: number;
  height?: number;
  deadline: number;
}): Promise<string> {
  const left = remainingMs(options.deadline);
  if (left < 2_000) {
    throw Object.assign(
      new Error("Waktu proses gambar habis (batas Vercel). Coba lagi."),
      { status: 504 }
    );
  }

  const body: Record<string, unknown> = {
    prompt: options.prompt,
  };

  if (options.model.includes("flux")) {
    body.steps = 4;
    body.seed = Math.floor(Math.random() * 1_000_000);
  } else {
    if (options.width && options.height) {
      body.width = options.width;
      body.height = options.height;
    }
    body.num_steps = options.model.includes("lightning")
      ? 6
      : options.model.includes("lcm")
        ? 8
        : 12;
    body.guidance = 7.5;
    body.negative_prompt =
      "text, letters, watermark, logo, UI, caption, blurry, low quality";
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.min(left - 500, isVercel ? 40_000 : 75_000)
  );

  try {
    const response = await fetch(
      runUrl(options.accountId, options.model),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let message = `Cloudflare HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errText) as {
          errors?: Array<{ message?: string }>;
          error?: string;
        };
        message =
          errJson.errors?.map((e) => e.message).filter(Boolean).join("; ") ||
          errJson.error ||
          message;
      } catch {
        if (errText.trim()) message = `${message}: ${errText.slice(0, 200)}`;
      }
      throw Object.assign(new Error(message), { status: response.status });
    }

    return await parseImageResponse(response, options.model);
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      throw Object.assign(new Error("Timeout generate gambar Cloudflare."), {
        status: 504,
      });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
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

  const { accountId, apiToken } = getCredentials();
  const fullPrompt = buildBackgroundPrompt(prompt, input.aspect);
  const size = aspectToImageSize(input.aspect);
  const deadline = Date.now() + IMAGE_GEN_BUDGET_MS;
  const models = [...SIZED_MODELS, FLUX_MODEL];

  let lastError: unknown;

  for (const model of models) {
    if (remainingMs(deadline) < 2_000) break;
    const useSize = !model.includes("flux");

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const imageDataUrl = await callModel({
          accountId,
          apiToken,
          model,
          prompt: fullPrompt,
          width: useSize ? size.width : undefined,
          height: useSize ? size.height : undefined,
          deadline,
        });
        return { imageDataUrl, model };
      } catch (error) {
        lastError = error;
        if ((error as { status?: number }).status === 504) throw error;
        if ((error as { status?: number }).status === 400) {
          // coba model berikutnya (mis. width tidak didukung)
          break;
        }
        if ((error as { status?: number }).status === 401) {
          throw Object.assign(
            new Error(
              "Token Cloudflare tidak valid. Buat ulang Workers AI API Token."
            ),
            { status: 401 }
          );
        }
        if (!isRetryable(error) || attempt === 2) break;
        const delay = Math.min(
          remainingMs(deadline) - 1_500,
          500 * attempt + Math.floor(Math.random() * 200)
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
      : "Gagal memanggil Cloudflare Workers AI.";

  if (isRetryable(lastError)) {
    throw Object.assign(
      new Error(
        "Cloudflare Workers AI sedang padat atau kuota harian habis. Coba lagi nanti, atau unggah foto manual."
      ),
      { status: 503 }
    );
  }

  throw Object.assign(
    new Error(
      message.includes("Cloudflare") || message.includes("gambar")
        ? message
        : `Gagal generate latar: ${message}`
    ),
    { status: 502 }
  );
}
