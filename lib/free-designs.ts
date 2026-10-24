import type { AspectRatio } from "@/lib/types";

export type FreeDesignId =
  | "quote-noir"
  | "quote-linen"
  | "quote-glass"
  | "quote-serif-light"
  | "quote-split"
  | "editorial-bar"
  | "impact-story"
  | "promo-badge"
  | "promo-deal"
  | "promo-soft";

export type FreeDesignCategory = "quote" | "poster" | "promo";

export interface FreeDesignPreset {
  id: FreeDesignId;
  name: string;
  category: FreeDesignCategory;
  description: string;
  /** Preview swatch colors */
  swatch: [string, string, string];
  preferredAspect: AspectRatio;
  fonts: {
    display: string;
    body: string;
  };
  colors: {
    text: string;
    muted: string;
    accent: string;
    overlay: string;
    card?: string;
    highlightBg: string;
    highlightFg: string;
  };
}

export const FREE_DESIGNS: FreeDesignPreset[] = [
  {
    id: "quote-noir",
    name: "Noir Quote",
    category: "quote",
    description: "Gelap elegan — tipografi besar, aksen tipis",
    swatch: ["#0a0a0a", "#e7e5e4", "#a8a29e"],
    preferredAspect: "1080x1350",
    fonts: {
      display: "var(--font-fraunces)",
      body: "var(--font-dm-sans)",
    },
    colors: {
      text: "#fafaf9",
      muted: "rgba(250,250,249,0.72)",
      accent: "#a8a29e",
      overlay:
        "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.2) 100%)",
      highlightBg: "#e7e5e4",
      highlightFg: "#0a0a0a",
    },
  },
  {
    id: "quote-linen",
    name: "Linen Editorial",
    category: "quote",
    description: "Hangat premium — band krem di bawah foto",
    swatch: ["#1c1917", "#f5f0e8", "#b45309"],
    preferredAspect: "1080x1350",
    fonts: {
      display: "var(--font-fraunces)",
      body: "var(--font-plus-jakarta)",
    },
    colors: {
      text: "#1c1917",
      muted: "#57534e",
      accent: "#b45309",
      overlay: "transparent",
      card: "#f5f0e8",
      highlightBg: "#fbbf24",
      highlightFg: "#1c1917",
    },
  },
  {
    id: "quote-glass",
    name: "Glass Card",
    category: "quote",
    description: "Kartu kaca di atas foto — modern & bersih",
    swatch: ["#0f172a", "#ffffff", "#38bdf8"],
    preferredAspect: "1080x1080",
    fonts: {
      display: "var(--font-space-grotesk)",
      body: "var(--font-dm-sans)",
    },
    colors: {
      text: "#0f172a",
      muted: "#475569",
      accent: "#0284c7",
      overlay:
        "linear-gradient(135deg, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0.15) 100%)",
      card: "rgba(255,255,255,0.88)",
      highlightBg: "#38bdf8",
      highlightFg: "#0f172a",
    },
  },
  {
    id: "quote-serif-light",
    name: "Serif Light",
    category: "quote",
    description: "Terang minimal — quote serif di tengah",
    swatch: ["#fafaf9", "#1c1917", "#78716c"],
    preferredAspect: "1080x1350",
    fonts: {
      display: "var(--font-fraunces)",
      body: "var(--font-manrope)",
    },
    colors: {
      text: "#1c1917",
      muted: "#57534e",
      accent: "#78716c",
      overlay:
        "linear-gradient(to bottom, rgba(250,250,249,0.55) 0%, rgba(250,250,249,0.88) 100%)",
      card: "#fafaf9",
      highlightBg: "#1c1917",
      highlightFg: "#fafaf9",
    },
  },
  {
    id: "quote-split",
    name: "Split Quote",
    category: "quote",
    description: "Foto atas, tipografi bold di panel bawah gelap",
    swatch: ["#18181b", "#fafafa", "#f97316"],
    preferredAspect: "1080x1350",
    fonts: {
      display: "var(--font-syne)",
      body: "var(--font-outfit)",
    },
    colors: {
      text: "#fafafa",
      muted: "rgba(250,250,250,0.65)",
      accent: "#f97316",
      overlay: "transparent",
      card: "#18181b",
      highlightBg: "#f97316",
      highlightFg: "#18181b",
    },
  },
  {
    id: "editorial-bar",
    name: "Editorial Bar",
    category: "poster",
    description: "Strip aksen + judul bold — gaya majalah",
    swatch: ["#09090b", "#fafafa", "#ef4444"],
    preferredAspect: "1080x1350",
    fonts: {
      display: "var(--font-syne)",
      body: "var(--font-outfit)",
    },
    colors: {
      text: "#fafafa",
      muted: "rgba(250,250,250,0.7)",
      accent: "#ef4444",
      overlay:
        "linear-gradient(to top, rgba(9,9,11,0.9) 0%, rgba(9,9,11,0.35) 55%, transparent 100%)",
      highlightBg: "#ef4444",
      highlightFg: "#ffffff",
    },
  },
  {
    id: "impact-story",
    name: "Impact Story",
    category: "poster",
    description: "9:16 impact — judul besar untuk Story/Reels cover",
    swatch: ["#042f2e", "#f0fdfa", "#2dd4bf"],
    preferredAspect: "1080x1920",
    fonts: {
      display: "var(--font-bebas)",
      body: "var(--font-manrope)",
    },
    colors: {
      text: "#f0fdfa",
      muted: "rgba(240,253,250,0.75)",
      accent: "#2dd4bf",
      overlay:
        "linear-gradient(to top, rgba(2,44,34,0.95) 0%, rgba(2,44,34,0.4) 50%, transparent 100%)",
      highlightBg: "#2dd4bf",
      highlightFg: "#042f2e",
    },
  },
  {
    id: "promo-badge",
    name: "Promo Badge",
    category: "promo",
    description: "Badge PROMO + headline kuat di atas foto",
    swatch: ["#0f172a", "#fff7ed", "#ea580c"],
    preferredAspect: "1080x1350",
    fonts: {
      display: "var(--font-space-grotesk)",
      body: "var(--font-dm-sans)",
    },
    colors: {
      text: "#ffffff",
      muted: "rgba(255,255,255,0.78)",
      accent: "#ea580c",
      overlay:
        "linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.35) 55%, rgba(15,23,42,0.15) 100%)",
      highlightBg: "#ea580c",
      highlightFg: "#ffffff",
    },
  },
  {
    id: "promo-deal",
    name: "Deal Burst",
    category: "promo",
    description: "Panel aksen besar — cocok penawaran & CTA",
    swatch: ["#111827", "#fef3c7", "#dc2626"],
    preferredAspect: "1080x1080",
    fonts: {
      display: "var(--font-bebas)",
      body: "var(--font-plus-jakarta)",
    },
    colors: {
      text: "#111827",
      muted: "#4b5563",
      accent: "#dc2626",
      overlay:
        "linear-gradient(160deg, rgba(17,24,39,0.25) 0%, rgba(17,24,39,0.55) 100%)",
      card: "#fef3c7",
      highlightBg: "#dc2626",
      highlightFg: "#ffffff",
    },
  },
  {
    id: "promo-soft",
    name: "Soft Promo",
    category: "promo",
    description: "Pastel lembut — promo ramah & premium",
    swatch: ["#ecfdf5", "#064e3b", "#34d399"],
    preferredAspect: "1080x1350",
    fonts: {
      display: "var(--font-outfit)",
      body: "var(--font-manrope)",
    },
    colors: {
      text: "#064e3b",
      muted: "#047857",
      accent: "#059669",
      overlay: "transparent",
      card: "#ecfdf5",
      highlightBg: "#34d399",
      highlightFg: "#064e3b",
    },
  },
];

export const DEFAULT_FREE_DESIGN_ID: FreeDesignId = "quote-noir";

export function getFreeDesign(id: FreeDesignId | string): FreeDesignPreset {
  return FREE_DESIGNS.find((d) => d.id === id) ?? FREE_DESIGNS[0]!;
}

const STORAGE_KEY = "newstopost.freeDesignId";

export function loadStoredFreeDesignId(): FreeDesignId {
  if (typeof window === "undefined") return DEFAULT_FREE_DESIGN_ID;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value && FREE_DESIGNS.some((d) => d.id === value)) {
      return value as FreeDesignId;
    }
  } catch {
    // ignore
  }
  return DEFAULT_FREE_DESIGN_ID;
}

export function saveStoredFreeDesignId(id: FreeDesignId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
}

export function categoryLabel(category: FreeDesignCategory): string {
  if (category === "quote") return "Quote";
  if (category === "promo") return "Promo";
  return "Poster";
}
