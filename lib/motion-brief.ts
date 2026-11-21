import type { ParagraphCount } from "@/lib/paragraph-count";

export type MotionStyle = "explainer" | "ticker" | "minimal" | "teal-gold";
export type MotionTone = "netral" | "santai" | "tegas";
export type MotionAspect = "9:16" | "1:1" | "16:9" | "4:5";

export type MotionStylePalette = {
  bgA: string;
  bgB: string;
  accent: string;
  card: string;
  ink: string;
  muted: string;
};

/** Opsi durasi di UI Motion Graphic. */
export const MOTION_DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;
export type MotionDurationSec = (typeof MOTION_DURATION_OPTIONS)[number];

export type MotionPacing = {
  durationSec: number;
  factCount: ParagraphCount;
  /** Total kata VO (hook+facts+outro) yang dituju. */
  targetVoWordsMin: number;
  targetVoWordsMax: number;
  hookVoWords: string;
  factVoWords: string;
  outroVoWords: string;
  guidance: string;
};

/** Panjang naskah & jumlah fakta menyesuaikan durasi video. */
export function resolveMotionPacing(durationSec: number): MotionPacing {
  const d = Math.max(8, Math.round(Number(durationSec) || 15));
  if (d <= 20) {
    return {
      durationSec: d,
      factCount: 2,
      targetVoWordsMin: 28,
      targetVoWordsMax: 42,
      hookVoWords: "8–14",
      factVoWords: "8–14",
      outroVoWords: "5–9",
      guidance:
        "Video pendek (~15s): VO sangat ringkas. Tiap beat 1 kalimat pendek yang lengkap.",
    };
  }
  if (d <= 35) {
    return {
      durationSec: d,
      factCount: 3,
      targetVoWordsMin: 55,
      targetVoWordsMax: 78,
      hookVoWords: "10–16",
      factVoWords: "12–20",
      outroVoWords: "6–10",
      guidance:
        "Video ~30s: VO sedang. Hook singkat, tiap fakta 1–2 kalimat lengkap.",
    };
  }
  if (d <= 50) {
    return {
      durationSec: d,
      factCount: 3,
      targetVoWordsMin: 85,
      targetVoWordsMax: 115,
      hookVoWords: "12–18",
      factVoWords: "18–28",
      outroVoWords: "8–12",
      guidance:
        "Video ~45s: kembangkan konteks. Tiap fakta boleh 2 kalimat faktual lengkap.",
    };
  }
  if (d <= 75) {
    return {
      durationSec: d,
      factCount: 3,
      targetVoWordsMin: 115,
      targetVoWordsMax: 155,
      hookVoWords: "14–22",
      factVoWords: "24–38",
      outroVoWords: "8–14",
      guidance:
        "Video ~60s: naskah lebih panjang. Tambah detail/latar di tiap fakta (tetap kalimat lengkap, tanpa menggantung).",
    };
  }
  return {
    durationSec: d,
    factCount: 4,
    targetVoWordsMin: 165,
    targetVoWordsMax: 220,
    hookVoWords: "16–24",
    factVoWords: "28–42",
    outroVoWords: "10–16",
    guidance:
      "Video ~90s: naskah paling lengkap. 4 fakta berurutan (latar → peristiwa → dampak/reaksi → konteks lanjutan), tiap VO 2 kalimat padat.",
  };
}

export function normalizeMotionDurationSec(value: unknown): number {
  const n = Math.round(Number(value));
  if ((MOTION_DURATION_OPTIONS as readonly number[]).includes(n)) return n;
  if (Number.isFinite(n) && n >= 8) return Math.min(120, Math.max(8, n));
  return 15;
}

export type WordTiming = {
  word: string;
  startSec: number;
  endSec: number;
};

export type MotionBeat = {
  id: string;
  role: "hook" | "fact" | "outro";
  startSec: number;
  endSec: number;
  /** Naskah suara (ElevenLabs / TTS). */
  vo: string;
  /** Teks kartu / on-screen (boleh beda dari VO). */
  onScreen: string;
  /** Alias Remotion: sama dengan onScreen. */
  caption: string;
  words: string[];
  wordTimings: WordTiming[];
  visual: string;
  /** Remote image URL from scrape (filled when available). */
  imageUrl?: string | null;
  /** Local Remotion static path after render download (e.g. media/beat-hook.jpg). */
  imageSrc?: string | null;
};

export type MotionProductionGuide = {
  for: "claude";
  voiceover: string;
  images: string;
  onScreen: string;
  timing: string;
  output: string;
  /** Deskripsi visual singkat untuk Claude. */
  look: string;
  /** Hex / rgba palette yang harus diikuti. */
  palette: MotionStylePalette;
  /** Siap ditempel ke Claude bersama file brief. */
  promptHint: string;
};

export type MotionBrief = {
  version: number;
  generatedAt: string;
  sourceUrl: string;
  channel: string;
  cta: string;
  title: string;
  durationSec: number;
  aspect: MotionAspect;
  style: MotionStyle;
  tone: MotionTone;
  fps: number;
  width: number;
  height: number;
  /** Naskah penuh ElevenLabs (paragraf per beat). */
  voText: string;
  /** Unique article image URLs used across beats. */
  images: string[];
  beats: MotionBeat[];
  production: MotionProductionGuide;
  pipeline: {
    tts: string;
    render: string;
    karaoke: string;
    images: string;
    noCapCut: true;
  };
};

/** Brief ringkas untuk diunggah ke Claude (tanpa noise Remotion). */
export type ClaudeMotionBrief = {
  version: number;
  generatedAt: string;
  sourceUrl: string;
  channel: string;
  cta: string;
  title: string;
  /** Perkiraan durasi target UI — retiming wajib setelah audio jadi. */
  estimatedDurationSec: number;
  aspect: MotionAspect;
  style: MotionStyle;
  tone: MotionTone;
  width: number;
  height: number;
  voText: string;
  images: string[];
  beats: Array<{
    id: string;
    role: MotionBeat["role"];
    estimatedStartSec: number;
    estimatedEndSec: number;
    vo: string;
    onScreen: string;
    visual: string;
    imageUrl: string | null;
  }>;
  production: MotionProductionGuide;
};

export type MotionNarrationInput = {
  hook: { vo: string; onScreen: string };
  facts: Array<{ vo: string; onScreen: string }>;
  outro: { vo: string; onScreen: string };
};

export type BuildMotionBriefInput = {
  title: string;
  points: string[];
  /** Naskah Gemini (VO + on-screen). Jika ada, dipakai utuh tanpa pemotongan lokal. */
  narration?: MotionNarrationInput;
  sourceUrl?: string;
  channel?: string;
  cta?: string;
  durationSec?: number;
  aspect?: MotionAspect;
  style?: MotionStyle;
  tone?: MotionTone;
  mainImage?: string | null;
  images?: string[];
};

const STYLE_META: Record<MotionStyle, string> = {
  explainer: "clean lower-thirds, icon beats, soft kinetic type",
  ticker: "bold headline cards, urgency ticker, hard cuts",
  minimal: "sparse typography, soft transitions, calm editorial",
  "teal-gold":
    "deep teal backgrounds, antique gold accents, editorial news cards",
};

export function paletteForMotionStyle(style: MotionStyle): MotionStylePalette {
  if (style === "ticker") {
    return {
      bgA: "#111827",
      bgB: "#7f1d1d",
      accent: "#fbbf24",
      card: "rgba(17, 24, 39, 0.88)",
      ink: "#f8fafc",
      muted: "#fecaca",
    };
  }
  if (style === "minimal") {
    return {
      bgA: "#f8fafc",
      bgB: "#e2e8f0",
      accent: "#0f766e",
      card: "rgba(255, 255, 255, 0.92)",
      ink: "#0f172a",
      muted: "#475569",
    };
  }
  if (style === "teal-gold") {
    return {
      bgA: "#0f3d3e",
      bgB: "#134e4a",
      accent: "#d97706",
      card: "rgba(15, 61, 62, 0.9)",
      ink: "#fffbeb",
      muted: "#99f6e4",
    };
  }
  return {
    bgA: "#0b1220",
    bgB: "#123a5f",
    accent: "#38bdf8",
    card: "rgba(15, 23, 42, 0.82)",
    ink: "#f8fafc",
    muted: "#cbd5e1",
  };
}

function lookForMotionStyle(style: MotionStyle): string {
  if (style === "ticker") {
    return "Bold ticker: latar gelap merah, aksen kuning terang, kesan breaking news.";
  }
  if (style === "minimal") {
    return "Clean minimal: latar terang netral, aksen toska, tipografi tenang.";
  }
  if (style === "teal-gold") {
    return "Toska + emas: background toska tua, aksen kuning tua/emas antik, kartu gelap editorial.";
  }
  return "News explainer: latar biru gelap, aksen cyan, lower-third bersih.";
}

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function limitWords(text: string, maxWords: number): string {
  const words = normalizeSpaces(text).split(" ").filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

function ensureSpokenSentence(text: string): string {
  const t = normalizeSpaces(text)
    .replace(/[…]+$/g, "")
    .replace(/[,:;]+$/g, "");
  if (!t) return "";
  if (/[.!?…]$/.test(t)) return t;
  return `${t}.`;
}

function wordsFromCaption(text: string): string[] {
  return text
    .replace(/[“”"']/g, "")
    .replace(/[^\p{L}\p{N}\s|-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Seconds needed to speak a line (estimate for brief windows). */
function speechSeconds(text: string): number {
  const count = Math.max(1, wordsFromCaption(text).length);
  return Number((count / 2.35 + 0.45).toFixed(2));
}

function spokenHook(title: string, tone: MotionTone): string {
  const headline = normalizeSpaces(title);
  if (tone === "santai") {
    return ensureSpokenSentence(`Yuk simak. ${headline}`);
  }
  if (tone === "tegas") {
    return ensureSpokenSentence(headline);
  }
  return ensureSpokenSentence(headline);
}

/** On-card fact line: punchy, no forced ellipsis when short enough. */
function onScreenFact(point: string): string {
  return limitWords(point, 16);
}

/** Spoken fact: keep meaning, cap length for ElevenLabs comfort. */
function spokenFact(point: string): string {
  return ensureSpokenSentence(limitWords(point, 34));
}

function spokenOutro(cta: string, tone: MotionTone): string {
  const line = normalizeSpaces(cta);
  if (tone === "santai" && !/yuk|ayo|ikut/i.test(line)) {
    return ensureSpokenSentence(`Kalau bermanfaat, ${line}`);
  }
  return ensureSpokenSentence(line);
}

function allocateBeatWindows(durationSec: number, speechBudgets: number[]) {
  const total = Math.max(8, durationSec);
  const count = Math.max(2, speechBudgets.length);
  const raw = speechBudgets
    .slice(0, count)
    .map((s) => Math.max(1.3, Number(s) || 1.3));
  while (raw.length < count) raw.push(2);
  const rawSum = raw.reduce((a, b) => a + b, 0) || 1;
  const scale = total / rawSum;
  const windows: Array<{ startSec: number; endSec: number }> = [];
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    if (i === count - 1) {
      windows.push({
        startSec: Number(cursor.toFixed(2)),
        endSec: total,
      });
      break;
    }
    const span = Number((raw[i]! * scale).toFixed(2));
    const end = Number((cursor + span).toFixed(2));
    windows.push({
      startSec: Number(cursor.toFixed(2)),
      endSec: end,
    });
    cursor = end;
  }
  return windows;
}

function wordTimingsForBeat(
  words: string[],
  startSec: number,
  endSec: number
): WordTiming[] {
  const list = words.length ? words : ["…"];
  const span = Math.max(0.4, endSec - startSec);
  const each = span / list.length;
  return list.map((word, i) => ({
    word,
    startSec: Number((startSec + i * each).toFixed(3)),
    endSec: Number((startSec + (i + 1) * each).toFixed(3)),
  }));
}

export function aspectToSize(aspect: MotionAspect): {
  width: number;
  height: number;
} {
  if (aspect === "16:9") return { width: 1920, height: 1080 };
  if (aspect === "1:1") return { width: 1080, height: 1080 };
  if (aspect === "4:5") return { width: 1080, height: 1350 };
  return { width: 1080, height: 1920 };
}

/** Deduplicate + keep http(s) only; main image first. */
export function collectBriefImages(
  mainImage?: string | null,
  images?: string[]
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined) => {
    const url = typeof raw === "string" ? raw.trim() : "";
    if (!url || seen.has(url)) return;
    if (!/^https?:\/\//i.test(url)) return;
    seen.add(url);
    out.push(url);
  };
  push(mainImage);
  for (const img of images || []) push(img);
  return out;
}

function assignBeatImage(
  role: MotionBeat["role"],
  indexAmongVisual: number,
  pool: string[]
): string | null {
  if (!pool.length) return null;
  if (role === "outro") return null;
  return pool[indexAmongVisual % pool.length] || pool[0] || null;
}

function buildProductionGuide(input: {
  channel: string;
  aspect: MotionAspect;
  style: MotionStyle;
  width: number;
  height: number;
  imageCount: number;
}): MotionProductionGuide {
  const { channel, aspect, style, width, height, imageCount } = input;
  const palette = paletteForMotionStyle(style);
  const look = lookForMotionStyle(style);
  return {
    for: "claude",
    voiceover:
      "voText / beats[].vo sudah ditulis Gemini (kalimat lengkap). Pakai langsung di ElevenLabs. Setelah audio jadi, retiming wajib ke estimatedStartSec/estimatedEndSec.",
    images:
      imageCount > 0
        ? "Unggah foto dari images[] dan beats[].imageUrl ke Claude. Hook & fact sudah punya saran URL bila scrape berhasil."
        : "Brief tanpa foto scrape — minta user unggah 1–3 foto relevan, atau pakai background tipografi saja.",
    onScreen:
      "Teks kartu: beats[].onScreen. Hook memakai judul penuh — jangan dipotong kecuali overflow layout. VO boleh lebih pendek dari onScreen.",
    timing:
      "Semua angka detik di brief adalah perkiraan app, bukan timing final karaoke/subtitle.",
    output: `MP4 ${aspect} (${width}×${height}), style ${style}, channel "${channel}".`,
    look,
    palette,
    promptHint: [
      "Buat motion graphic berita dari brief JSON ini.",
      "1) Generate voiceover ElevenLabs dari voText (panjang naskah sudah disesuaikan target durasi).",
      "2) Pakai / minta foto dari images dan imageUrl per beat.",
      "3) Sesuaikan durasi tiap beat ke audio final (abaikan estimasi detik jika tidak cocok).",
      "4) Teks on-screen dari onScreen; branding channel; CTA di outro.",
      `5) Ikuti look/palette: ${look} bgA ${palette.bgA}, bgB ${palette.bgB}, accent ${palette.accent}, ink ${palette.ink}.`,
      `6) Export MP4 ${aspect} ${width}x${height}.`,
    ].join(" "),
  };
}

export function buildMotionBrief(input: BuildMotionBriefInput): MotionBrief {
  const durationSec = Math.max(8, Number(input.durationSec) || 15);
  const aspect = input.aspect || "9:16";
  const style = input.style || "explainer";
  const tone = input.tone || "netral";
  const channel = (input.channel || "NewsToPost").trim() || "NewsToPost";
  const cta =
    (input.cta || "Ikuti untuk update berikutnya").trim() ||
    "Ikuti untuk update berikutnya";
  const size = aspectToSize(aspect);
  const title =
    normalizeSpaces(input.title || "Update berita hari ini") ||
    "Update berita hari ini";
  const imagePool = collectBriefImages(input.mainImage, input.images);
  const narration = input.narration;

  let hookVo: string;
  let hookOnScreen: string;
  let factLines: Array<{ vo: string; onScreen: string }>;
  let outroVo: string;
  let outroOnScreen: string;

  if (narration?.hook?.vo && narration.facts?.length) {
    hookVo = ensureSpokenSentence(narration.hook.vo);
    hookOnScreen = title;
    factLines = narration.facts
      .map((line) => ({
        vo: ensureSpokenSentence(line.vo),
        onScreen: normalizeSpaces(line.onScreen),
      }))
      .filter((line) => line.vo && line.onScreen)
      .slice(0, 3);
    while (factLines.length < 2) {
      const fallbackPoint =
        (input.points || []).map(normalizeSpaces).filter(Boolean)[0] ||
        "Detail lengkap menyusul dari sumber berita.";
      factLines.push({
        vo: spokenFact(fallbackPoint),
        onScreen: onScreenFact(fallbackPoint),
      });
    }
    outroVo = ensureSpokenSentence(narration.outro?.vo || spokenOutro(cta, tone));
    outroOnScreen =
      normalizeSpaces(narration.outro?.onScreen || "") || limitWords(cta, 12);
  } else {
    const facts = (input.points || [])
      .map((p) => normalizeSpaces(p))
      .filter(Boolean)
      .slice(0, 3);
    while (facts.length < 2) {
      facts.push(facts[0] || "Detail lengkap menyusul dari sumber berita.");
    }
    hookVo = spokenHook(title, tone);
    hookOnScreen = title;
    factLines = facts.map((fact) => ({
      vo: spokenFact(fact),
      onScreen: onScreenFact(fact),
    }));
    outroVo = spokenOutro(cta, tone);
    outroOnScreen = limitWords(cta, 12);
  }

  const rawBeats: Array<
    Omit<MotionBeat, "startSec" | "endSec" | "words" | "wordTimings">
  > = [
    {
      id: "hook",
      role: "hook",
      vo: hookVo,
      onScreen: hookOnScreen,
      caption: hookOnScreen,
      visual: imagePool.length
        ? "photo background + headline card"
        : "headline card + channel badge",
      imageUrl: assignBeatImage("hook", 0, imagePool),
    },
    ...factLines.map((line, i) => ({
      id: `fact${i + 1}`,
      role: "fact" as const,
      vo: line.vo,
      onScreen: line.onScreen,
      caption: line.onScreen,
      visual: imagePool.length
        ? "photo background + fact card"
        : "fact card + lower-third",
      imageUrl: assignBeatImage("fact", i + 1, imagePool),
    })),
    {
      id: "outro",
      role: "outro",
      vo: outroVo,
      onScreen: outroOnScreen,
      caption: outroOnScreen,
      visual: "CTA card",
      imageUrl: null,
    },
  ];

  const windows = allocateBeatWindows(
    durationSec,
    rawBeats.map((beat) => speechSeconds(beat.vo))
  );
  const beats: MotionBeat[] = rawBeats.map((beat, i) => {
    const win = windows[i] || windows[windows.length - 1]!;
    const words = wordsFromCaption(beat.onScreen);
    return {
      ...beat,
      startSec: win.startSec,
      endSec: win.endSec,
      words,
      wordTimings: wordTimingsForBeat(words, win.startSec, win.endSec),
    };
  });

  const voText = beats.map((b) => b.vo).join("\n\n");
  const production = buildProductionGuide({
    channel,
    aspect,
    style,
    width: size.width,
    height: size.height,
    imageCount: imagePool.length,
  });

  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    sourceUrl: input.sourceUrl || "",
    channel,
    cta,
    title,
    durationSec,
    aspect,
    style,
    tone,
    fps: 30,
    width: size.width,
    height: size.height,
    voText,
    images: imagePool,
    beats,
    production,
    pipeline: {
      tts: narration
        ? "Gemini naskah VO → ElevenLabs (Claude) atau edge-tts (Remotion lokal)"
        : "edge-tts → remotion-news/public/voice.mp3 ( Remotion lokal )",
      render:
        "cd remotion-news && .\\render.ps1 -Brief ..\\path\\brief.json",
      karaoke: `style ${style}: ${STYLE_META[style]}`,
      images:
        "render.mjs downloads beat imageUrl → public/media/* then Remotion Img",
      noCapCut: true,
    },
  };
}

/** Versi ringkas untuk unggah ke Claude + ElevenLabs. */
export function toClaudeMotionBrief(brief: MotionBrief): ClaudeMotionBrief {
  return {
    version: brief.version,
    generatedAt: brief.generatedAt,
    sourceUrl: brief.sourceUrl,
    channel: brief.channel,
    cta: brief.cta,
    title: brief.title,
    estimatedDurationSec: brief.durationSec,
    aspect: brief.aspect,
    style: brief.style,
    tone: brief.tone,
    width: brief.width,
    height: brief.height,
    voText: brief.voText,
    images: brief.images,
    beats: brief.beats.map((beat) => ({
      id: beat.id,
      role: beat.role,
      estimatedStartSec: beat.startSec,
      estimatedEndSec: beat.endSec,
      vo: beat.vo,
      onScreen: beat.onScreen || beat.caption,
      visual: beat.visual,
      imageUrl: beat.imageUrl ?? null,
    })),
    production: brief.production,
  };
}

export function motionBriefFileName(brief: MotionBrief): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `news-brief-${stamp}.json`;
}

export function claudeMotionBriefFileName(brief: MotionBrief): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `news-brief-claude-${stamp}.json`;
}
