"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface UrlFormProps {
  url: string;
  aspect: AspectRatio;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onAspectChange: (value: AspectRatio) => void;
  onSubmit: () => void;
}

export function UrlForm({
  url,
  aspect,
  loading,
  onUrlChange,
  onAspectChange,
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

      <Button type="submit" disabled={loading || !url.trim()} className="w-full sm:w-auto">
        {loading ? "Generating…" : "Generate Carousel"}
      </Button>
    </form>
  );
}
