export type MotionStyle = "explainer" | "ticker" | "minimal";
export type MotionTone = "netral" | "santai" | "tegas";
export type MotionAspect = "9:16" | "1:1" | "16:9" | "4:5";

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

export type BuildMotionBriefInput = {
  title: string;
  points: string[];
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
};

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
  return {
    for: "claude",
    voiceover:
      "Pakai field voText (atau tiap beats[].vo) sebagai naskah ElevenLabs. Setelah MP3/WAV jadi, retiming wajib: sesuaikan estimatedStartSec/estimatedEndSec tiap beat ke audio final.",
    images:
      imageCount > 0
        ? "Unggah foto dari images[] dan beats[].imageUrl ke Claude. Hook & fact sudah punya saran URL bila scrape berhasil."
        : "Brief tanpa foto scrape — minta user unggah 1–3 foto relevan, atau pakai background tipografi saja.",
    onScreen:
      "Teks kartu: beats[].onScreen. Hook memakai judul penuh — jangan dipotong kecuali overflow layout. VO boleh lebih pendek dari onScreen.",
    timing:
      "Semua angka detik di brief adalah perkiraan app, bukan timing final karaoke/subtitle.",
    output: `MP4 ${aspect} (${width}×${height}), style ${style}, channel "${channel}".`,
    promptHint: [
      "Buat motion graphic berita dari brief JSON ini.",
      "1) Generate voiceover ElevenLabs dari voText.",
      "2) Pakai / minta foto dari images dan imageUrl per beat.",
      "3) Sesuaikan durasi tiap beat ke audio final (abaikan estimasi detik jika tidak cocok).",
      "4) Teks on-screen dari onScreen; branding channel; CTA di outro.",
      `5) Export MP4 ${aspect} ${width}x${height}.`,
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
  const facts = (input.points || [])
    .map((p) => normalizeSpaces(p))
    .filter(Boolean)
    .slice(0, 3);
  while (facts.length < 2) {
    facts.push(facts[0] || "Detail lengkap menyusul dari sumber berita.");
  }

  const hookVo = spokenHook(title, tone);
  const hookOnScreen = title;
  const factLines = facts.map((fact) => ({
    vo: spokenFact(fact),
    onScreen: onScreenFact(fact),
  }));
  const outroVo = spokenOutro(cta, tone);
  const outroOnScreen = limitWords(cta, 12);

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
      tts: "edge-tts → remotion-news/public/voice.mp3 ( Remotion lokal )",
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
