export type StyleTheme = {
  bgA: string;
  bgB: string;
  accent: string;
  card: string;
  ink: string;
  muted: string;
  karaokeBase: string;
  karaokeActive: string;
};

export function themeForStyle(style: string): StyleTheme {
  if (style === "ticker") {
    return {
      bgA: "#111827",
      bgB: "#7f1d1d",
      accent: "#fbbf24",
      card: "rgba(17, 24, 39, 0.88)",
      ink: "#f8fafc",
      muted: "#fecaca",
      karaokeBase: "rgba(248, 250, 252, 0.55)",
      karaokeActive: "#fbbf24",
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
      karaokeBase: "rgba(15, 23, 42, 0.35)",
      karaokeActive: "#0f766e",
    };
  }
  return {
    bgA: "#0b1220",
    bgB: "#123a5f",
    accent: "#38bdf8",
    card: "rgba(15, 23, 42, 0.82)",
    ink: "#f8fafc",
    muted: "#cbd5e1",
    karaokeBase: "rgba(248, 250, 252, 0.45)",
    karaokeActive: "#38bdf8",
  };
}
