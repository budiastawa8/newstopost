export type TemplateId =
  | "classic"
  | "midnight-teal"
  | "editorial-ink"
  | "neon-pulse"
  | "clean-paper";

export type CoverTextAlign = "left" | "center";
export type CoverTextPosition = "bottom" | "center";

export interface DesignTemplate {
  id: TemplateId;
  name: string;
  description: string;
  swatch: [string, string, string];
  fonts: {
    display: string;
    body: string;
  };
  colors: {
    summaryFrom: string;
    summaryVia: string;
    summaryTo: string;
    label: string;
    title: string;
    body: string;
    accent: string;
    caption: string;
    coverOverlay: string;
    photoVignette: string;
  };
  layout: {
    coverAlign: CoverTextAlign;
    coverPosition: CoverTextPosition;
    labelUppercase: boolean;
    labelTracking: string;
    summaryTitleSize: { square: number; portrait: number };
    coverTitleSize: { square: number; portrait: number };
    bodySize: { square: number; portrait: number };
  };
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "classic",
    name: "Asli (Classic)",
    description: "Tampilan awal app — Geist, overlay gelap, ringkasan teal",
    swatch: ["#020617", "#0f172a", "#0f766e"],
    fonts: {
      display: "var(--font-geist-sans)",
      body: "var(--font-geist-sans)",
    },
    colors: {
      // Tailwind: slate-950 → slate-900 → teal-950
      summaryFrom: "#020617",
      summaryVia: "#0f172a",
      summaryTo: "#042f2e",
      label: "rgba(228, 228, 231, 0.9)",
      title: "#ffffff",
      body: "#f4f4f5",
      accent: "#5eead4",
      caption: "rgba(255,255,255,0.9)",
      coverOverlay:
        "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.62) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)",
      // Hanya sudut logo — foto tetap penuh terang
      photoVignette:
        "linear-gradient(to bottom right, rgba(0,0,0,0.4) 0%, transparent 32%)",
    },
    layout: {
      coverAlign: "left",
      coverPosition: "bottom",
      labelUppercase: true,
      labelTracking: "0.2em",
      summaryTitleSize: { square: 28, portrait: 30 },
      coverTitleSize: { square: 52, portrait: 58 },
      bodySize: { square: 30, portrait: 32 },
    },
  },
  {
    id: "midnight-teal",
    name: "Midnight Teal",
    description: "Variasi gelap modern — Space Grotesk + DM Sans",
    swatch: ["#0f172a", "#134e4a", "#5eead4"],
    fonts: {
      display: "var(--font-space-grotesk)",
      body: "var(--font-dm-sans)",
    },
    colors: {
      summaryFrom: "#020617",
      summaryVia: "#0f172a",
      summaryTo: "#042f2e",
      label: "rgba(204, 251, 241, 0.9)",
      title: "#ffffff",
      body: "#f4f4f5",
      accent: "#5eead4",
      caption: "rgba(255,255,255,0.9)",
      coverOverlay:
        "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.62) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)",
      photoVignette:
        "linear-gradient(to bottom right, rgba(0,0,0,0.4) 0%, transparent 32%)",
    },
    layout: {
      coverAlign: "left",
      coverPosition: "bottom",
      labelUppercase: true,
      labelTracking: "0.2em",
      summaryTitleSize: { square: 28, portrait: 30 },
      coverTitleSize: { square: 52, portrait: 58 },
      bodySize: { square: 30, portrait: 32 },
    },
  },
  {
    id: "editorial-ink",
    name: "Editorial Ink",
    description: "Nuansa koran digital — Fraunces + Jakarta Sans",
    swatch: ["#1c1917", "#fafaf9", "#b45309"],
    fonts: {
      display: "var(--font-fraunces)",
      body: "var(--font-plus-jakarta)",
    },
    colors: {
      summaryFrom: "#1c1917",
      summaryVia: "#292524",
      summaryTo: "#44403c",
      label: "#fbbf24",
      title: "#fafaf9",
      body: "#e7e5e4",
      accent: "#f59e0b",
      caption: "rgba(250,250,249,0.92)",
      coverOverlay:
        "linear-gradient(to top, rgba(28,25,23,0.9) 0%, rgba(28,25,23,0.6) 45%, rgba(28,25,23,0.2) 75%, transparent 100%)",
      photoVignette:
        "linear-gradient(to bottom right, rgba(28,25,23,0.38) 0%, transparent 32%)",
    },
    layout: {
      coverAlign: "left",
      coverPosition: "bottom",
      labelUppercase: true,
      labelTracking: "0.16em",
      summaryTitleSize: { square: 30, portrait: 32 },
      coverTitleSize: { square: 50, portrait: 56 },
      bodySize: { square: 28, portrait: 30 },
    },
  },
  {
    id: "neon-pulse",
    name: "Neon Pulse",
    description: "Bold sosial — Syne display + Outfit body",
    swatch: ["#09090b", "#db2777", "#22d3ee"],
    fonts: {
      display: "var(--font-syne)",
      body: "var(--font-outfit)",
    },
    colors: {
      summaryFrom: "#09090b",
      summaryVia: "#18181b",
      summaryTo: "#4a044e",
      label: "#22d3ee",
      title: "#ffffff",
      body: "#f4f4f5",
      accent: "#db2777",
      caption: "rgba(255,255,255,0.92)",
      coverOverlay:
        "linear-gradient(to top, rgba(9,9,11,0.9) 0%, rgba(219,39,119,0.35) 38%, rgba(9,9,11,0.2) 72%, transparent 100%)",
      photoVignette:
        "linear-gradient(to bottom right, rgba(9,9,11,0.42) 0%, transparent 34%)",
    },
    layout: {
      coverAlign: "left",
      coverPosition: "bottom",
      labelUppercase: true,
      labelTracking: "0.24em",
      summaryTitleSize: { square: 30, portrait: 32 },
      coverTitleSize: { square: 54, portrait: 60 },
      bodySize: { square: 29, portrait: 31 },
    },
  },
  {
    id: "clean-paper",
    name: "Clean Paper",
    description: "Terang minimal — Manrope + Bebas Neue judul",
    swatch: ["#f8fafc", "#0f172a", "#2563eb"],
    fonts: {
      display: "var(--font-bebas)",
      body: "var(--font-manrope)",
    },
    colors: {
      summaryFrom: "#f8fafc",
      summaryVia: "#f1f5f9",
      summaryTo: "#e2e8f0",
      label: "#2563eb",
      title: "#0f172a",
      body: "#1e293b",
      accent: "#2563eb",
      caption: "rgba(255,255,255,0.95)",
      coverOverlay:
        "linear-gradient(to top, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.45) 50%, rgba(15,23,42,0.12) 78%, transparent 100%)",
      photoVignette:
        "linear-gradient(to bottom right, rgba(15,23,42,0.36) 0%, transparent 32%)",
    },
    layout: {
      coverAlign: "center",
      coverPosition: "center",
      labelUppercase: true,
      labelTracking: "0.28em",
      summaryTitleSize: { square: 36, portrait: 40 },
      coverTitleSize: { square: 56, portrait: 64 },
      bodySize: { square: 28, portrait: 30 },
    },
  },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "classic";

export function getTemplate(id: TemplateId | string): DesignTemplate {
  return (
    DESIGN_TEMPLATES.find((t) => t.id === id) ?? DESIGN_TEMPLATES[0]
  );
}

const STORAGE_KEY = "newstopost.designTemplate";

export function loadStoredTemplateId(): TemplateId {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE_ID;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value && DESIGN_TEMPLATES.some((t) => t.id === value)) {
      return value as TemplateId;
    }
  } catch {
    // ignore
  }
  return DEFAULT_TEMPLATE_ID;
}

export function saveStoredTemplateId(id: TemplateId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
}
