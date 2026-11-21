"use client";

import { useMemo, useState } from "react";
import { CaptionPanel } from "@/components/caption-panel";
import { GenerateProgress } from "@/components/generate-progress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  claudeMotionBriefFileName,
  motionBriefFileName,
  toClaudeMotionBrief,
  type MotionAspect,
  type MotionBrief,
  type MotionStyle,
  type MotionTone,
} from "@/lib/motion-brief";
import type { ApiErrorBody, SummarizeResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "scrape" | "summarize" | "compose" | "ready";

async function readError(response: Response): Promise<string> {
  const raw = await response.text();
  try {
    const data = JSON.parse(raw) as ApiErrorBody;
    if (data.error?.trim()) return data.error;
  } catch {
    // ignore
  }
  const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 160);
  if (snippet) return `HTTP ${response.status}: ${snippet}`;
  return `HTTP ${response.status}`;
}

function downloadJsonFile(fileName: string, payload: unknown) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadRemotionBrief(brief: MotionBrief) {
  downloadJsonFile(motionBriefFileName(brief), brief);
}

function downloadClaudeBrief(brief: MotionBrief) {
  downloadJsonFile(claudeMotionBriefFileName(brief), toClaudeMotionBrief(brief));
}

export function MotionGraphicClient() {
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [channel, setChannel] = useState("NewsToPost");
  const [cta, setCta] = useState("Ikuti untuk update berikutnya");
  const [durationSec, setDurationSec] = useState(15);
  const [aspect, setAspect] = useState<MotionAspect>("9:16");
  const [style, setStyle] = useState<MotionStyle>("explainer");
  const [tone, setTone] = useState<MotionTone>("netral");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<MotionBrief | null>(null);
  const [summary, setSummary] = useState<SummarizeResult | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loading = phase === "scrape" || phase === "summarize" || phase === "compose";

  const renderCommand = useMemo(() => {
    if (!brief) {
      return `.\\remotion-news\\render.ps1 -Brief .\\path\\news-brief.json`;
    }
    return `.\\remotion-news\\render.ps1 -Brief .\\Downloads\\${motionBriefFileName(brief)}`;
  }, [brief]);

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      setCopiedKey(null);
    }
  }

  async function handleGenerate() {
    setError(null);
    setBrief(null);
    setSummary(null);
    setSourceUrl(null);

    const trimmedUrl = url.trim();
    const text = pastedText.trim();
    if (!trimmedUrl && !text) {
      setError("Isi URL berita atau tempel teks berita.");
      return;
    }

    setPhase(trimmedUrl ? "scrape" : "summarize");
    try {
      if (trimmedUrl) setPhase("scrape");
      setPhase("summarize");
      const response = await fetch("/api/motion-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmedUrl || undefined,
          text: text || undefined,
          channel,
          cta,
          durationSec,
          aspect,
          style,
          tone,
        }),
      });
      if (!response.ok) throw new Error(await readError(response));

      setPhase("compose");
      const data = (await response.json()) as {
        brief: MotionBrief;
        summary: SummarizeResult;
        sourceUrl?: string;
      };
      setBrief(data.brief);
      setSummary(data.summary);
      setSourceUrl(data.sourceUrl || data.brief.sourceUrl || trimmedUrl || null);
      setPhase("ready");
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Gagal membuat brief.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>News → Motion Graphic</CardTitle>
          <CardDescription>
            Scrape + foto + Gemini (ringkasan, caption, naskah VO + teks
            layar) → brief Claude/ElevenLabs atau Remotion lokal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="motion-url">URL berita</Label>
            <Input
              id="motion-url"
              type="url"
              placeholder="https://contoh.com/berita/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motion-text">Atau tempel teks berita</Label>
            <textarea
              id="motion-text"
              rows={7}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={loading}
              placeholder="Tempel cuplikan/isi berita jika scrape gagal atau tanpa URL."
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-offset-white placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Durasi</Label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60].map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={loading}
                    onClick={() => setDurationSec(value)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      durationSec === value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rasio</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["9:16", "9:16"],
                    ["1:1", "1:1"],
                    ["4:5", "4:5"],
                    ["16:9", "16:9"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={loading}
                    onClick={() => setAspect(value)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      aspect === value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="motion-style">Gaya</Label>
              <select
                id="motion-style"
                value={style}
                disabled={loading}
                onChange={(e) => setStyle(e.target.value as MotionStyle)}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="explainer">News explainer</option>
                <option value="ticker">Bold ticker</option>
                <option value="minimal">Clean minimal</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motion-tone">Nada narasi</Label>
              <select
                id="motion-tone"
                value={tone}
                disabled={loading}
                onChange={(e) => setTone(e.target.value as MotionTone)}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="netral">Netral berita</option>
                <option value="santai">Santai</option>
                <option value="tegas">Tegas</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motion-channel">Channel</Label>
              <Input
                id="motion-channel"
                value={channel}
                disabled={loading}
                onChange={(e) => setChannel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motion-cta">CTA outro</Label>
              <Input
                id="motion-cta"
                value={cta}
                disabled={loading}
                onChange={(e) => setCta(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={() => void handleGenerate()}
          >
            {loading ? "Generating…" : "Generate Motion Brief"}
          </Button>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? <GenerateProgress phase={phase === "compose" ? "compose" : phase === "scrape" ? "scrape" : "summarize"} /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
          <CardDescription>
            Untuk Claude + ElevenLabs: unduh brief Claude. Remotion lokal
            opsional lewat brief penuh + perintah render.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!brief ? (
            <p className="text-sm text-zinc-500">
              Hasil ringkasan, caption + hashtag, naskah VO, dan karaoke muncul
              di sini setelah generate.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => downloadClaudeBrief(brief)}>
                  Unduh brief untuk Claude
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    copyText(
                      "prompt",
                      `${brief.production.promptHint}\n\n---\nUnggah juga file brief Claude + audio ElevenLabs dari voText + foto dari images/imageUrl.`
                    )
                  }
                >
                  {copiedKey === "prompt"
                    ? "Instruksi tersalin!"
                    : "Salin instruksi Claude"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyText("vo", brief.voText)}
                >
                  {copiedKey === "vo" ? "VO tersalin!" : "Salin naskah VO"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => downloadRemotionBrief(brief)}
                >
                  Unduh brief Remotion
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyText("render", renderCommand)}
                >
                  {copiedKey === "render"
                    ? "Perintah tersalin!"
                    : "Salin perintah render"}
                </Button>
              </div>

              <div className="rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2 text-xs leading-relaxed text-teal-950">
                <p className="font-semibold text-teal-900">Alur Claude</p>
                <p className="mt-1">{brief.production.promptHint}</p>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
                {renderCommand}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900">{brief.title}</p>
                <p className="text-xs text-zinc-500">
                  {brief.durationSec}s · {brief.aspect} · {brief.style} ·{" "}
                  {brief.width}×{brief.height}
                  {brief.images?.length
                    ? ` · ${brief.images.length} foto berita`
                    : " · tanpa foto (teks-only)"}
                </p>
              </div>

              {brief.images?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Foto otomatis di video
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {brief.images.slice(0, 6).map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-md border border-zinc-200 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Foto ikut di brief.json dan diunduh otomatis saat{" "}
                    <code>render.ps1</code>.
                  </p>
                </div>
              ) : null}

              {summary ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Ringkasan Gemini (poin berita)
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
                    {summary.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Beats · VO + on-screen
                </p>
                {brief.beats.map((beat) => (
                  <div
                    key={beat.id}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-teal-700">
                      [{beat.startSec}–{beat.endSec}s] {beat.id}
                      {beat.imageUrl ? " · foto" : ""}
                    </p>
                    <p className="mt-1 text-sm text-zinc-800">
                      <span className="text-xs font-semibold text-zinc-500">
                        VO:{" "}
                      </span>
                      {beat.vo}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                      <span className="text-xs font-semibold text-zinc-500">
                        Layar:{" "}
                      </span>
                      {beat.onScreen || beat.caption}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Naskah VO Gemini → ElevenLabs
                </p>
                <p className="whitespace-pre-wrap rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-800">
                  {brief.voText}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>

      {summary ? (
        <CaptionPanel summarize={summary} sourceUrl={sourceUrl} />
      ) : null}
    </div>
  );
}
