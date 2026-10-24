"use client";

import { useEffect, useRef, useState } from "react";
import { StorySlide } from "@/components/slides/story-slide";
import { STORY_SIZE } from "@/lib/aspect";
import type { DesignTemplate } from "@/lib/templates";

export interface StoryPreviewProps {
  title: string;
  imageUrl: string | null;
  logoSrc: string | null;
  template: DesignTemplate;
  coverLabel: string;
  titleHighlights?: string[] | null;
  generationKey: string;
}

export function StoryPreview({
  title,
  imageUrl,
  logoSrc,
  template,
  coverLabel,
  titleHighlights,
  generationKey,
}: StoryPreviewProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(220);
  const scale = width / STORY_SIZE.width;
  const height = STORY_SIZE.height * scale;

  useEffect(() => {
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = el.clientWidth;
      setWidth(Math.max(160, Math.min(w, 280)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={shellRef} className="flex w-full flex-col items-center gap-3 border-t border-zinc-100 pt-5">
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-600">Story 9:16</p>
        <p className="text-xs text-zinc-400">1080×1920</p>
      </div>
      <div
        className="overflow-hidden rounded-xl shadow-lg ring-1 ring-zinc-200"
        style={{ width, height }}
      >
        <div
          className="origin-top-left"
          style={{
            transform: `scale(${scale})`,
            width: STORY_SIZE.width,
            height: STORY_SIZE.height,
          }}
        >
          <StorySlide
            title={title}
            imageUrl={imageUrl}
            logoSrc={logoSrc}
            template={template}
            coverLabel={coverLabel}
            titleHighlights={titleHighlights}
            imageCacheKey={`${generationKey}::story-preview`}
          />
        </div>
      </div>
    </div>
  );
}
