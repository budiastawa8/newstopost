"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { FreeDesignLayoutControls } from "@/components/free-design-layout-controls";
import { FreeDesignPicker } from "@/components/free-design-picker";
import { LogoUploader } from "@/components/logo-uploader";
import { FreeDesignSlide } from "@/components/slides/free-design-slide";
import { TitleHighlightPicker } from "@/components/title-highlight-picker";
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
import { getAspectSize } from "@/lib/aspect";
import { captureFreeDesignToPngDataUrl } from "@/lib/capture-free-design";
import {
  getFreeDesign,
  loadStoredFreeDesignId,
  saveStoredFreeDesignId,
  type FreeDesignId,
} from "@/lib/free-designs";
import { loadStoredLogo } from "@/lib/logo-storage";
import type {
  ApiErrorBody,
  AspectRatio,
  FreeDesignCopyResult,
  FreeDesignCopyTone,
  FreeDesignImageResult,
  FreeDesignLayout,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const ASPECT_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: "1080x1350", label: "4:5" },
  { value: "1080x1080", label: "1:1" },
  { value: "1080x1920", label: "9:16" },
];

const TONE_OPTIONS: { value: FreeDesignCopyTone; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "formal", label: "Formal" },
  { value: "santai", label: "Santai" },
  { value: "promo", label: "Promo" },
];

const DEFAULT_LAYOUT: FreeDesignLayout = { fontScale: 1, shiftY: 0 };

function downloadPng(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

async function readError(response: Response): Promise<string> {
  const raw = await response.text();
  try {
    const data = JSON.parse(raw) as ApiErrorBody;
    if (data.error?.trim()) return data.error;
  } catch {
    // bukan JSON
  }
  const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 160);
  if (snippet) return `HTTP ${response.status}: ${snippet}`;
  return `HTTP ${response.status}. Coba lagi sebentar.`;
}

export function FreeDesignClient() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [designId, setDesignId] = useState<FreeDesignId>("quote-noir");
  const [aspect, setAspect] = useState<AspectRatio>("1080x1350");
  const [brief, setBrief] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [tone, setTone] = useState<FreeDesignCopyTone>("natural");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [layout, setLayout] = useState<FreeDesignLayout>(DEFAULT_LAYOUT);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(320);
  const shellRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startClientY: number;
    startShiftY: number;
  } | null>(null);

  const busy = exporting || generatingCopy || generatingImage;
  const design = getFreeDesign(designId);
  const size = useMemo(() => getAspectSize(aspect), [aspect]);
  const scale = previewWidth / size.width;
  const previewHeight = size.height * scale;

  useEffect(() => {
    setLogoSrc(loadStoredLogo());
    const stored = loadStoredFreeDesignId();
    setDesignId(stored);
    setAspect(getFreeDesign(stored).preferredAspect);
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      setPreviewWidth(Math.max(240, Math.min(el.clientWidth, 400)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function handleDesignChange(id: FreeDesignId) {
    setDesignId(id);
    saveStoredFreeDesignId(id);
    setAspect(getFreeDesign(id).preferredAspect);
    setLayout(DEFAULT_LAYOUT);
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Pilih file gambar (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Ukuran foto maksimal 8 MB.");
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Gagal membaca foto."));
        };
        reader.onerror = () => reject(new Error("Gagal membaca foto."));
        reader.readAsDataURL(file);
      });
      setImageUrl(dataUrl);
      setImageModel(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    }
  }

  async function handleGenerateCopy() {
    if (brief.trim().length < 8) {
      setError("Tulis brief singkat dulu (minimal 8 karakter).");
      return;
    }
    setError(null);
    setGeneratingCopy(true);
    try {
      const res = await fetch("/api/free-design-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: brief.trim(),
          category: design.category,
          designName: design.name,
          tone,
        }),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const data = (await res.json()) as FreeDesignCopyResult;
      setHeadline(data.headline);
      setSubtext(data.subtext);
      setHighlights([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal generate copy dengan AI."
      );
    } finally {
      setGeneratingCopy(false);
    }
  }

  async function handleGenerateImage() {
    const prompt = (imagePrompt.trim() || brief.trim()).slice(0, 600);
    if (prompt.length < 8) {
      setError("Isi prompt latar (atau brief) minimal 8 karakter.");
      return;
    }
    setError(null);
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/free-design-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect }),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const data = (await res.json()) as FreeDesignImageResult;
      setImageUrl(data.imageDataUrl);
      setImageModel(data.model);
      if (!imagePrompt.trim()) setImagePrompt(prompt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal generate latar dengan AI."
      );
    } finally {
      setGeneratingImage(false);
    }
  }

  function onDragHandlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (busy) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClientY: event.clientY,
      startShiftY: layout.shiftY,
    };
  }

  function onDragHandlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaDesignPx = (event.clientY - drag.startClientY) / scale;
    const next = Math.min(
      220,
      Math.max(-220, Math.round(drag.startShiftY + deltaDesignPx))
    );
    setLayout((prev) =>
      prev.shiftY === next ? prev : { ...prev, shiftY: next }
    );
  }

  function onDragHandlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }

  async function handleDownload() {
    if (!headline.trim()) {
      setError("Isi judul atau quote dulu.");
      return;
    }
    setError(null);
    setExporting(true);
    try {
      const dataUrl = await captureFreeDesignToPngDataUrl({
        design,
        size,
        imageUrl,
        headline: headline.trim(),
        subtext: subtext.trim() || undefined,
        logoSrc,
        titleHighlights: highlights,
        layout,
      });
      const slug =
        headline
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40) || "desain";
      downloadPng(dataUrl, `newstopost-${design.id}-${slug}.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunduh PNG.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle>Desain bebas</CardTitle>
          <CardDescription>
            Prompt → latar Gemini → copy → atur teks → unduh PNG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <LogoUploader
            logoSrc={logoSrc}
            disabled={busy}
            onLogoChange={setLogoSrc}
            onError={setError}
          />

          <FreeDesignPicker
            value={designId}
            disabled={busy}
            onChange={handleDesignChange}
          />

          <div className="space-y-2">
            <Label>Rasio</Label>
            <div className="flex gap-2">
              {ASPECT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setAspect(option.value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    aspect === option.value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
            <Label htmlFor="free-image-prompt">Prompt latar (Gemini)</Label>
            <textarea
              id="free-image-prompt"
              rows={3}
              value={imagePrompt}
              disabled={busy}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Mis. Cafe pantai Sanur pagi hari, cahaya lembut, tanpa teks"
              maxLength={600}
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="flex-1"
                disabled={
                  busy ||
                  (imagePrompt.trim().length < 8 && brief.trim().length < 8)
                }
                onClick={handleGenerateImage}
              >
                {generatingImage ? "Membuat latar…" : "Generate latar AI"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {imageUrl ? "Ganti foto" : "Unggah"}
              </Button>
              {imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setImageUrl(null);
                    setImageModel(null);
                  }}
                >
                  Hapus
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500">
              Imagen diganti Gemini image (Nano Banana). Tanpa teks di dalam
              gambar — teks ditambahkan di editor.
              {imageModel ? ` · Model: ${imageModel}` : null}
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
            <Label htmlFor="free-brief">Brief copy</Label>
            <textarea
              id="free-brief"
              rows={2}
              value={brief}
              disabled={busy}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={
                design.category === "promo"
                  ? "Mis. Kopi susu oat, diskon 30% weekend"
                  : "Mis. Motivasi pagi untuk tim sales"
              }
              maxLength={500}
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
            />
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setTone(option.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    tone === option.value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy || brief.trim().length < 8}
              onClick={handleGenerateCopy}
            >
              {generatingCopy ? "Menulis copy…" : "Generate copy"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="free-headline">Judul / quote</Label>
            <textarea
              id="free-headline"
              rows={3}
              value={headline}
              disabled={busy}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Tulis manual atau generate dari brief…"
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="free-sub">
              {design.category === "promo"
                ? "CTA / detail (opsional)"
                : "Teks pendukung (opsional)"}
            </Label>
            <Input
              id="free-sub"
              value={subtext}
              disabled={busy}
              onChange={(e) => setSubtext(e.target.value)}
              placeholder={
                design.category === "promo"
                  ? "Mis. Berlaku hingga Minggu · Klaim sekarang"
                  : "Kredit, lokasi, atau kalimat pendek"
              }
              maxLength={120}
            />
          </div>

          {headline.trim() ? (
            <TitleHighlightPicker
              title={headline}
              highlights={highlights}
              disabled={busy}
              accentBg={design.colors.highlightBg}
              accentFg={design.colors.highlightFg}
              onChange={setHighlights}
            />
          ) : null}

          <FreeDesignLayoutControls
            layout={layout}
            disabled={busy}
            onChange={setLayout}
          />

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={busy || !headline.trim()}
            onClick={handleDownload}
          >
            {exporting ? "Menyiapkan PNG…" : "Download PNG"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle>Preview / editor</CardTitle>
          <CardDescription>
            {design.name} · {size.width}×{size.height}
            {generatingImage ? " · generating latar…" : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div ref={shellRef} className="flex w-full justify-center">
            <div
              className="relative overflow-hidden rounded-xl shadow-lg ring-1 ring-zinc-200"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <div
                className="origin-top-left"
                style={{
                  transform: `scale(${scale})`,
                  width: size.width,
                  height: size.height,
                }}
              >
                <FreeDesignSlide
                  design={design}
                  size={size}
                  imageUrl={imageUrl}
                  headline={headline}
                  subtext={subtext}
                  logoSrc={logoSrc}
                  titleHighlights={highlights}
                  layout={layout}
                />
              </div>
              <button
                type="button"
                aria-label="Geser posisi teks"
                disabled={busy}
                onPointerDown={onDragHandlePointerDown}
                onPointerMove={onDragHandlePointerMove}
                onPointerUp={onDragHandlePointerUp}
                onPointerCancel={onDragHandlePointerUp}
                className={cn(
                  "absolute left-1/2 z-20 flex h-8 w-28 -translate-x-1/2 cursor-ns-resize items-center justify-center rounded-full border border-white/70 bg-zinc-900/75 text-[10px] font-medium tracking-wide text-white shadow-lg backdrop-blur-sm disabled:opacity-40",
                  "touch-none select-none"
                )}
                style={{
                  top: `calc(${68 + (layout.shiftY / size.height) * 100}% - 16px)`,
                }}
              >
                ↕ geser teks
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
