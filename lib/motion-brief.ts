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
  vo: string;
  caption: string;
  words: string[];
  wordTimings: WordTiming[];
  visual: string;
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
  voText: string;
  beats: MotionBeat[];
  pipeline: {
    tts: string;
    render: string;
    karaoke: string;
    noCapCut: true;
  };
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
};

const STYLE_META: Record<MotionStyle, string> = {
  explainer: "clean lower-thirds, icon beats, soft kinetic type",
  ticker: "bold headline cards, urgency ticker, hard cuts",
  minimal: "sparse typography, soft transitions, calm editorial",
};

function clipWords(text: string, maxWords: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function wordsFromCaption(text: string): string[] {
  return text
    .replace(/[“”"']/g, "")
    .replace(/[^\p{L}\p{N}\s|-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function allocateBeatWindows(durationSec: number, beatCount: number) {
  const total = Math.max(8, durationSec);
  const count = Math.max(2, beatCount);
  const hook = Math.min(3, Math.max(2, Math.round(total * 0.18)));
  const outro = Math.min(4, Math.max(2, Math.round(total * 0.2)));
  const middleBudget = Math.max(total - hook - outro, count - 2);
  const middleCount = Math.max(1, count - 2);
  const slice = middleBudget / middleCount;
  const windows = [{ startSec: 0, endSec: hook }];
  let cursor = hook;
  for (let i = 0; i < middleCount; i += 1) {
    const end =
      i === middleCount - 1 ? total - outro : Number((cursor + slice).toFixed(2));
    windows.push({
      startSec: Number(cursor.toFixed(2)),
      endSec: Number(end.toFixed(2)),
    });
    cursor = end;
  }
  windows.push({
    startSec: Number((total - outro).toFixed(2)),
    endSec: total,
  });
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
  const title = clipWords(input.title || "Update berita hari ini", 12);
  const facts = (input.points || [])
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3);
  while (facts.length < 2) {
    facts.push(facts[0] || "Detail lengkap menyusul dari sumber berita.");
  }

  const rawBeats: Array<Omit<MotionBeat, "startSec" | "endSec" | "words" | "wordTimings" | "visual"> & { visual: string }> = [
    {
      id: "hook",
      role: "hook",
      vo: `Sorotan: ${title}`,
      caption: clipWords(title, 8),
      visual: "headline card + channel badge",
    },
    ...facts.map((fact, i) => ({
      id: `fact${i + 1}`,
      role: "fact" as const,
      vo: fact,
      caption: clipWords(fact, 8),
      visual: "fact card + lower-third",
    })),
    {
      id: "outro",
      role: "outro",
      vo: cta,
      caption: clipWords(cta, 8),
      visual: "CTA card",
    },
  ];

  const windows = allocateBeatWindows(durationSec, rawBeats.length);
  const beats: MotionBeat[] = rawBeats.map((beat, i) => {
    const win = windows[i] || windows[windows.length - 1]!;
    const words = wordsFromCaption(beat.caption);
    return {
      ...beat,
      startSec: win.startSec,
      endSec: win.endSec,
      words,
      wordTimings: wordTimingsForBeat(words, win.startSec, win.endSec),
    };
  });

  return {
    version: 1,
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
    voText: beats.map((b) => b.vo).join(" "),
    beats,
    pipeline: {
      tts: "edge-tts → remotion-news/public/voice.mp3",
      render:
        "cd remotion-news && .\\render.ps1 -Brief ..\\path\\brief.json",
      karaoke: `style ${style}: ${STYLE_META[style]}`,
      noCapCut: true,
    },
  };
}

export function motionBriefFileName(brief: MotionBrief): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `news-brief-${stamp}.json`;
}
