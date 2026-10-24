"use client";

import { forwardRef } from "react";
import { SlideFrame } from "@/components/slides/slide-frame";
import { SlideLogo } from "@/components/slides/slide-logo";
import { proxiedImageUrl } from "@/lib/aspect";
import type { DesignTemplate } from "@/lib/templates";
import type { AspectSize, PhotoSlideModel } from "@/lib/types";

export interface PhotoSlideProps {
  slide: PhotoSlideModel;
  size: AspectSize;
  logoSrc: string | null;
  template: DesignTemplate;
  imageCacheKey?: string;
}

export const PhotoSlide = forwardRef<HTMLDivElement, PhotoSlideProps>(
  function PhotoSlide(
    { slide, size, logoSrc, template, imageCacheKey },
    ref
  ) {
    const imageSrc = proxiedImageUrl(slide.imageUrl, imageCacheKey);

    return (
      <SlideFrame
        ref={ref}
        size={size}
        className="bg-zinc-900"
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
          <div className="absolute inset-0 bg-zinc-800" />
        )}

        <div
          className="absolute inset-0"
          style={{ background: template.colors.photoVignette }}
        />

        <SlideLogo logoSrc={logoSrc} tone="onDark" imgClassName="h-9" />

        {slide.caption ? (
          <p
            className="absolute bottom-10 left-0 right-0 z-10 text-center text-lg font-medium tracking-wide"
            style={{
              color: template.colors.caption,
              fontFamily: template.fonts.body,
            }}
          >
            {slide.caption}
          </p>
        ) : null}
      </SlideFrame>
    );
  }
);
