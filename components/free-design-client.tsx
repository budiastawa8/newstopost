"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
import type { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

const ASPECT_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: "1080x1350", label: "4:5" },
  { value: "1080x1080", label: "1:1" },
  { value: "1080x1920", label: "9:16" },
];

function downloadPng(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function FreeDesignClient() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [designId, setDesignId] = useState<FreeDesignId>("quote-noir");
  const [aspect, setAspect] = useState<AspectRatio>("1080x1350");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(320);
  const shellRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
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
            Unggah foto, ketik teks, pilih desain premium, unduh PNG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <LogoUploader
            logoSrc={logoSrc}
            disabled={exporting}
            onLogoChange={setLogoSrc}
            onError={setError}
          />

          <div className="space-y-2">
            <Label>Foto latar</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={exporting}
                onClick={() => fileRef.current?.click()}
              >
                {imageUrl ? "Ganti foto" : "Unggah foto"}
              </Button>
              {imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={exporting}
                  onClick={() => setImageUrl(null)}
                >
                  Hapus foto
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500">
              Opsional. Tanpa foto, memakai gradasi desain.
            </p>
          </div>

          <FreeDesignPicker
            value={designId}
            disabled={exporting}
            onChange={handleDesignChange}
          />

          <div className="space-y-2">
            <Label>Rasio</Label>
            <div className="flex gap-2">
              {ASPECT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={exporting}
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

          <div className="space-y-2">
            <Label htmlFor="free-headline">Judul / quote</Label>
            <textarea
              id="free-headline"
              rows={3}
              value={headline}
              disabled={exporting}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Tulis teks utama di sini…"
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="free-sub">Teks pendukung (opsional)</Label>
            <Input
              id="free-sub"
              value={subtext}
              disabled={exporting}
              onChange={(e) => setSubtext(e.target.value)}
              placeholder="Kredit, lokasi, atau kalimat pendek"
              maxLength={120}
            />
          </div>

          {headline.trim() ? (
            <TitleHighlightPicker
              title={headline}
              highlights={highlights}
              disabled={exporting}
              accentBg={design.colors.highlightBg}
              accentFg={design.colors.highlightFg}
              onChange={setHighlights}
            />
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={exporting || !headline.trim()}
            onClick={handleDownload}
          >
            {exporting ? "Menyiapkan PNG…" : "Download PNG"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {design.name} · {size.width}×{size.height}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div ref={shellRef} className="flex w-full justify-center">
            <div
              className="overflow-hidden rounded-xl shadow-lg ring-1 ring-zinc-200"
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
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
