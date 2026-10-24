"use client";

import { useEffect, useRef, useState } from "react";
import {
  CarouselPreview,
  type CarouselPreviewHandle,
} from "@/components/carousel-preview";
import { CaptionPanel } from "@/components/caption-panel";
import {
  GenerateProgress,
  PreviewSkeleton,
} from "@/components/generate-progress";
import { LogoUploader } from "@/components/logo-uploader";
import { TemplatePicker } from "@/components/template-picker";
import { UrlForm } from "@/components/url-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildSlides } from "@/lib/build-slides";
import {
  DEFAULT_COVER_LABEL,
  loadStoredCoverLabel,
  normalizeCoverLabel,
  saveStoredCoverLabel,
} from "@/lib/cover-label";
import { zipPngDataUrls } from "@/lib/export-slides";
import { loadStoredLogo } from "@/lib/logo-storage";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  loadStoredTemplateId,
  saveStoredTemplateId,
  type TemplateId,
} from "@/lib/templates";
import type {
  ApiErrorBody,
  AspectRatio,
  ScrapeResult,
  SlideModel,
  SummarizeResult,
} from "@/lib/types";

type GeneratePhase =
  | "idle"
  | "scrape"
  | "summarize"
  | "compose"
  | "ready"
  | "export";

async function readError(response: Response): Promise<string> {
  const raw = await response.text();
  try {
    const data = JSON.parse(raw) as ApiErrorBody;
    if (data.error?.trim()) return data.error;
  } catch {
    // bukan JSON (sering crash platform Vercel)
  }
  const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 160);
  if (snippet) return `HTTP ${response.status}: ${snippet}`;
  return `HTTP ${response.status}. Cek /api/health dan log Vercel (Functions).`;
}

export function HomeClient() {
  const [url, setUrl] = useState("");
  const [aspect, setAspect] = useState<AspectRatio>("1080x1350");
  const [phase, setPhase] = useState<GeneratePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [slides, setSlides] = useState<SlideModel[]>([]);
  const [summarizeResult, setSummarizeResult] =
    useState<SummarizeResult | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [generationKey, setGenerationKey] = useState<string>("");
  const [scrapeMeta, setScrapeMeta] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [coverLabel, setCoverLabel] = useState(DEFAULT_COVER_LABEL);
  const [templateId, setTemplateId] =
    useState<TemplateId>(DEFAULT_TEMPLATE_ID);
  const previewRef = useRef<CarouselPreviewHandle>(null);

  const loading =
    phase === "scrape" || phase === "summarize" || phase === "compose";
  const exporting = phase === "export";
  const template = getTemplate(templateId);

  useEffect(() => {
    setLogoSrc(loadStoredLogo());
    setTemplateId(loadStoredTemplateId());
    setCoverLabel(loadStoredCoverLabel());
  }, []);

  function handleTemplateChange(id: TemplateId) {
    setTemplateId(id);
    saveStoredTemplateId(id);
  }

  function handleCoverLabelChange(value: string) {
    const next = value.slice(0, 48);
    setCoverLabel(next);
    saveStoredCoverLabel(normalizeCoverLabel(next));
  }

  async function handleGenerate() {
    setError(null);
    setSlides([]);
    setSummarizeResult(null);
    setSourceTitle(null);
    setSourceUrl(null);
    setGenerationKey("");
    setScrapeMeta(null);

    try {
      setPhase("scrape");
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!scrapeRes.ok) {
        throw new Error(await readError(scrapeRes));
      }

      const scrape = (await scrapeRes.json()) as ScrapeResult;
      const via = scrape.fetchedVia ?? "html";
      const viaLabel =
        via === "wordpress"
          ? "WordPress API"
          : via === "rss"
            ? "RSS/Atom"
            : "HTML";
      setScrapeMeta(
        scrape.cacheHit
          ? `Cache hit · sebelumnya via ${viaLabel}`
          : `Diambil via ${viaLabel}`
      );

      setPhase("summarize");
      const summarizeRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scrape.content, title: scrape.title }),
      });

      if (!summarizeRes.ok) {
        throw new Error(await readError(summarizeRes));
      }

      const summarize = (await summarizeRes.json()) as SummarizeResult;

      setPhase("compose");
      // Beri jeda singkat agar step "Susun slide" sempat terasa di UI
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 450);
      });

      const nextSlides = buildSlides(scrape, summarize);
      const nextKey = `${scrape.sourceUrl}::${Date.now()}`;
      setSlides(nextSlides);
      setSummarizeResult(summarize);
      setSourceTitle(scrape.title);
      setSourceUrl(scrape.sourceUrl);
      setGenerationKey(nextKey);
      setPhase("ready");
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Gagal generate carousel.");
    }
  }

  async function handleDownload() {
    setError(null);
    try {
      setPhase("export");
      const capture = previewRef.current?.capturePngDataUrls;
      if (!capture) {
        throw new Error("Preview belum siap. Generate ulang lalu unduh lagi.");
      }
      const dataUrls = await capture();
      await zipPngDataUrls(dataUrls, {
        title: sourceTitle,
        generationKey,
      });
      setPhase("ready");
    } catch (err) {
      setPhase("ready");
      setError(
        err instanceof Error ? err.message : "Gagal mengunduh ZIP slide."
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          NewsToPost
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Berita jadi carousel Instagram
        </h1>
        <p className="max-w-2xl text-zinc-600">
          Tempel URL berita, generate ringkasan, lalu unduh slide PNG siap
          unggah (1080×1350 atau 1080×1080).
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Generate</CardTitle>
            <CardDescription>
              Scrape artikel, ringkas dengan Gemini, lalu bangun 3–5 slide.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoUploader
              logoSrc={logoSrc}
              disabled={loading || exporting}
              onLogoChange={setLogoSrc}
              onError={setError}
            />

            <TemplatePicker
              value={templateId}
              disabled={loading || exporting}
              onChange={handleTemplateChange}
            />

            <div className="space-y-2">
              <Label htmlFor="cover-label">Label cover</Label>
              <Input
                id="cover-label"
                type="text"
                placeholder={DEFAULT_COVER_LABEL}
                value={coverLabel}
                maxLength={48}
                disabled={loading || exporting}
                onChange={(e) => handleCoverLabelChange(e.target.value)}
              />
              <p className="text-xs text-zinc-500">
                Contoh: Berita utama, Breaking, Update. Kosongkan untuk
                menyembunyikan.
              </p>
            </div>

            <UrlForm
              url={url}
              aspect={aspect}
              loading={loading || exporting}
              onUrlChange={setUrl}
              onAspectChange={setAspect}
              onSubmit={handleGenerate}
            />

            {phase !== "idle" ? (
              <GenerateProgress phase={phase} scrapeMeta={scrapeMeta} />
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {slides.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                disabled={exporting}
                onClick={handleDownload}
                className="w-full"
              >
                {exporting ? "Menyiapkan ZIP…" : "Download ZIP (satu folder)"}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {sourceTitle
                ? sourceTitle
                : "Hasil carousel akan muncul di sini setelah generate."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PreviewSkeleton
                message={
                  phase === "scrape"
                    ? "Mengambil berita…"
                    : phase === "summarize"
                      ? "Menulis ringkasan & caption…"
                      : "Menyusun preview carousel…"
                }
              />
            ) : slides.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center text-sm text-zinc-500">
                Belum ada slide. Masukkan URL berita lalu klik Generate Carousel.
              </div>
            ) : (
              <CarouselPreview
                key={generationKey || sourceUrl || "preview"}
                ref={previewRef}
                slides={slides}
                aspect={aspect}
                logoSrc={logoSrc}
                template={template}
                coverLabel={normalizeCoverLabel(coverLabel)}
                generationKey={generationKey || sourceUrl || "preview"}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {summarizeResult ? (
        <CaptionPanel summarize={summarizeResult} sourceUrl={sourceUrl} />
      ) : null}
    </div>
  );
}
