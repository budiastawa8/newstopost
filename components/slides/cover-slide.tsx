"use client";

import { forwardRef } from "react";
import { SlideFrame } from "@/components/slides/slide-frame";
import { SlideLogo } from "@/components/slides/slide-logo";
import { proxiedImageUrl } from "@/lib/aspect";
import type { DesignTemplate } from "@/lib/templates";
import type { AspectSize, CoverSlideModel } from "@/lib/types";

export interface CoverSlideProps {
  slide: CoverSlideModel;
  size: AspectSize;
  logoSrc: string | null;
  template: DesignTemplate;
  coverLabel: string;
  imageCacheKey?: string;
}

export const CoverSlide = forwardRef<HTMLDivElement, CoverSlideProps>(
  function CoverSlide(
    { slide, size, logoSrc, template, coverLabel, imageCacheKey },
    ref
  ) {
    const imageSrc = proxiedImageUrl(slide.imageUrl, imageCacheKey);
    const isSquare = size.height === 1080;
    const titleSize = isSquare
      ? template.layout.coverTitleSize.square
      : template.layout.coverTitleSize.portrait;

    const textBlockClass =
      template.layout.coverPosition === "center"
        ? "absolute inset-0 z-10 flex flex-col items-center justify-center p-14 text-center"
        : "absolute inset-x-0 bottom-0 z-10 p-14 pb-16";

    return (
      <SlideFrame
        ref={ref}
        size={size}
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

        <div
          className="absolute inset-0"
          style={{ background: template.colors.coverOverlay }}
        />

        <SlideLogo logoSrc={logoSrc} />

        <div
          className={textBlockClass}
          style={{
            textAlign: template.layout.coverAlign,
            alignItems:
              template.layout.coverAlign === "center" ? "center" : "stretch",
          }}
        >
          {coverLabel.trim() ? (
            <p
              className="mb-4 text-sm font-semibold"
              style={{
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
          <h2
            className="font-bold leading-tight text-white"
            style={{
              fontSize: titleSize,
              fontFamily: template.fonts.display,
              maxWidth:
                template.layout.coverAlign === "center" ? "92%" : undefined,
            }}
          >
            {slide.title}
          </h2>
        </div>
      </SlideFrame>
    );
  }
);
