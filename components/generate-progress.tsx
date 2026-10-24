"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProgressPhase =
  | "idle"
  | "scrape"
  | "summarize"
  | "compose"
  | "ready"
  | "export";

export interface GenerateProgressProps {
  phase: ProgressPhase;
  scrapeMeta?: string | null;
}

const GENERATE_STEPS = [
  {
    id: "scrape" as const,
    label: "Ambil berita",
    activeText: "Mengambil konten dari URL…",
  },
  {
    id: "summarize" as const,
    label: "Ringkas + caption",
    activeText: "Gemini menulis ringkasan, caption & hashtag (otomatis retry jika padat)…",
  },
  {
    id: "compose" as const,
    label: "Susun slide",
    activeText: "Menyusun carousel siap preview…",
  },
];

const TIPS = [
  "Tip: template & label cover bisa diganti kapan saja.",
  "Tip: URL yang sama biasanya lebih cepat di generate kedua (cache).",
  "Tip: salin caption setelah selesai untuk langsung posting.",
  "Tip: logo brand tersimpan di browser ini.",
];

function activeGenerateIndex(phase: ProgressPhase): number {
  if (phase === "scrape") return 0;
  if (phase === "summarize") return 1;
  if (phase === "compose") return 2;
  if (phase === "ready") return 3;
  return -1;
}

function progressPercent(phase: ProgressPhase): number {
  if (phase === "export") return 70;
  if (phase === "ready") return 100;
  const idx = activeGenerateIndex(phase);
  if (idx < 0) return 0;
  return Math.min(92, Math.round(((idx + 0.55) / GENERATE_STEPS.length) * 100));
}

export function GenerateProgress({
  phase,
  scrapeMeta,
}: GenerateProgressProps) {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const busy =
    phase === "scrape" ||
    phase === "summarize" ||
    phase === "compose" ||
    phase === "export";

  useEffect(() => {
    if (!busy) {
      setElapsedSec(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    if (!busy) return;
    const tipTimer = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 3500);
    return () => window.clearInterval(tipTimer);
  }, [busy]);

  if (phase === "idle") return null;

  const percent = progressPercent(phase);
  const currentIdx = activeGenerateIndex(phase);

  const headline =
    phase === "ready"
      ? "Generate selesai"
      : phase === "export"
        ? "Merender PNG ke ZIP…"
        : (GENERATE_STEPS.find((s) => s.id === phase)?.activeText ??
          "Memproses…");

  return (
    <div
      className="space-y-3 rounded-lg border border-teal-100 bg-teal-50/70 p-3"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-teal-950">{headline}</p>
        <p className="shrink-0 text-xs tabular-nums text-teal-800/80">
          {percent}% · {elapsedSec}d
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-teal-100">
        <div
          className={cn(
            "h-full rounded-full bg-teal-600 transition-all duration-500 ease-out",
            busy && percent < 100 && "animate-pulse"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {phase === "export" ? (
        <div className="flex items-center gap-2 text-sm text-teal-950">
          <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
          Menyusun file slide satu per satu…
        </div>
      ) : (
        <ol className="space-y-2">
          {GENERATE_STEPS.map((step, index) => {
            const done = phase === "ready" || currentIdx > index;
            const isActive = currentIdx === index;

            return (
              <li
                key={step.id}
                className="flex items-center gap-2 text-sm text-teal-950"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                    done && "bg-teal-700 text-white",
                    isActive && "bg-teal-600 text-white",
                    !done &&
                      !isActive &&
                      "bg-white text-teal-700 ring-1 ring-teal-200"
                  )}
                >
                  {done ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : isActive ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={cn(isActive && "font-medium")}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {busy ? (
        <p key={tipIndex} className="text-xs text-teal-800/80">
          {TIPS[tipIndex]}
        </p>
      ) : null}

      {phase === "ready" && scrapeMeta ? (
        <p className="text-xs text-teal-800/80">{scrapeMeta}</p>
      ) : null}
    </div>
  );
}

export function PreviewSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-lg border border-dashed border-teal-200 bg-gradient-to-b from-teal-50/90 to-zinc-50 px-6 py-10">
      <div className="relative h-52 w-40 overflow-hidden rounded-xl bg-zinc-200 shadow-md ring-1 ring-zinc-300/80">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-100 via-zinc-300/70 to-zinc-200" />
        <div className="absolute inset-x-4 bottom-4 space-y-2">
          <div className="h-2.5 animate-pulse rounded bg-white/55" />
          <div className="h-2.5 w-3/4 animate-pulse rounded bg-white/40" />
          <div className="h-2 w-1/2 animate-pulse rounded bg-white/30" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-teal-900">
        <Loader2 className="h-4 w-4 animate-spin" />
        {message ?? "Menyusun preview carousel…"}
      </div>
    </div>
  );
}
