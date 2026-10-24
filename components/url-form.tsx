"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PARAGRAPH_COUNT_OPTIONS,
  type ParagraphCount,
} from "@/lib/paragraph-count";
import type { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface UrlFormProps {
  url: string;
  aspect: AspectRatio;
  paragraphCount: ParagraphCount;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onAspectChange: (value: AspectRatio) => void;
  onParagraphCountChange: (value: ParagraphCount) => void;
  onSubmit: () => void;
}

export function UrlForm({
  url,
  aspect,
  paragraphCount,
  loading,
  onUrlChange,
  onAspectChange,
  onParagraphCountChange,
  onSubmit,
}: UrlFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="news-url">URL berita</Label>
        <Input
          id="news-url"
          type="url"
          placeholder="https://contoh.com/berita/..."
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Rasio slide</Label>
        <div className="flex gap-2">
          {(
            [
              { value: "1080x1350", label: "1080×1350 (4:5)" },
              { value: "1080x1080", label: "1080×1080 (1:1)" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={loading}
              onClick={() => onAspectChange(option.value)}
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
        <Label>Jumlah paragraf ringkasan</Label>
        <div className="flex gap-2">
          {PARAGRAPH_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              disabled={loading}
              onClick={() => onParagraphCountChange(count)}
              className={cn(
                "min-w-12 rounded-md border px-3 py-2 text-sm transition-colors",
                paragraphCount === count
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              )}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Untuk rasio 4:5, coba 4 paragraf agar slide ringkasan lebih terisi.
        </p>
      </div>

      <Button type="submit" disabled={loading || !url.trim()} className="w-full sm:w-auto">
        {loading ? "Generating…" : "Generate Carousel"}
      </Button>
    </form>
  );
}
