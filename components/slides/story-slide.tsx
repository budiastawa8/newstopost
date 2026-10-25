"use client";

import { forwardRef } from "react";
import { HighlightedTitle } from "@/components/slides/highlighted-title";
import { SlideFrame } from "@/components/slides/slide-frame";
import { SlideLogo } from "@/components/slides/slide-logo";
import { STORY_SIZE, proxiedImageUrl } from "@/lib/aspect";
import { DEFAULT_FONT_SCALE, scalePx } from "@/lib/font-scale";
import type { DesignTemplate } from "@/lib/templates";

export interface StorySlideProps {
  title: string;
  imageUrl: string | null;
  logoSrc: string | null;
  template: DesignTemplate;
  coverLabel: string;
  titleHighlights?: string[] | null;
  imageCacheKey?: string;
  fontScale?: number;
}

/** Satu frame 9:16 (1080×1920) untuk IG/FB Story — reuse data cover. */
export const StorySlide = forwardRef<HTMLDivElement, StorySlideProps>(
  function StorySlide(
    {
      title,
      imageUrl,
      logoSrc,
      template,
      coverLabel,
      titleHighlights,
      imageCacheKey,
      fontScale = DEFAULT_FONT_SCALE,
    },
    ref
  ) {
    const imageSrc = proxiedImageUrl(imageUrl, imageCacheKey);
    const titleSize = scalePx(64, fontScale);
    const labelSize = scalePx(16, fontScale);

    return (
      <SlideFrame
        ref={ref}
        size={STORY_SIZE}
        style={{ fontFamily: template.fonts.body }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            crossOrigin="anonymous"
            loading="eager"
            decoding="sync"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        )}

        <SlideLogo logoSrc={logoSrc} className="right-12 top-14" imgClassName="h-11" />

        <div
          className="absolute inset-x-0 bottom-0 z-10 px-16 pb-28 pt-48"
          style={{
            textAlign: template.layout.coverAlign,
            alignItems:
              template.layout.coverAlign === "center" ? "center" : "stretch",
            background: template.colors.coverOverlay,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {coverLabel.trim() ? (
            <p
              className="mb-5 font-semibold"
              style={{
                fontSize: labelSize,
                color: template.colors.accent,
                textTransform: template.layout.labelUppercase
                  ? "uppercase"
                  : "none",
                letterSpacing: template.layout.labelTracking,
                fontFamily: template.fonts.body,
              }}
            >
              {coverLabel.trim()}
            </p>
          ) : null}
          <HighlightedTitle
            title={title}
            highlights={titleHighlights}
            highlightBg={template.colors.titleHighlightBg}
            highlightFg={template.colors.titleHighlightFg}
            className="font-bold leading-tight text-white"
            style={{
              fontSize: titleSize,
              fontFamily: template.fonts.display,
              maxWidth:
                template.layout.coverAlign === "center" ? "94%" : undefined,
            }}
          />
        </div>
      </SlideFrame>
    );
  }
);
