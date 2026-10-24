"use client";

import { forwardRef } from "react";
import { SlideFrame } from "@/components/slides/slide-frame";
import { SlideLogo } from "@/components/slides/slide-logo";
import type { DesignTemplate } from "@/lib/templates";
import type { AspectSize, SummarySlideModel } from "@/lib/types";

export interface SummarySlideProps {
  slide: SummarySlideModel;
  size: AspectSize;
  logoSrc: string | null;
  template: DesignTemplate;
}

export const SummarySlide = forwardRef<HTMLDivElement, SummarySlideProps>(
  function SummarySlide({ slide, size, logoSrc, template }, ref) {
    const isSquare = size.height === 1080;
    const paragraphs = slide.points;
    const count = paragraphs.length;
    const baseFont = isSquare
      ? template.layout.bodySize.square
      : template.layout.bodySize.portrait;
    // 2 paragraf: lebih besar biar mengisi; 4: sedikit dipadatkan
    const fontSize =
      count <= 2 ? baseFont + (isSquare ? 4 : 6) : count >= 4 ? baseFont - 2 : baseFont;
    const titleSize = isSquare
      ? template.layout.summaryTitleSize.square
      : template.layout.summaryTitleSize.portrait;
    const gap =
      count <= 2 ? (isSquare ? 40 : 52) : count >= 4 ? (isSquare ? 20 : 24) : isSquare ? 28 : 36;
    const isLight = template.id === "clean-paper";
    const distribute =
      !isSquare && count <= 3 ? "justify-between" : "justify-start";

    return (
      <SlideFrame
        ref={ref}
        size={size}
        style={{
          fontFamily: template.fonts.body,
          background: `linear-gradient(to bottom right, ${template.colors.summaryFrom}, ${template.colors.summaryVia}, ${template.colors.summaryTo})`,
        }}
      >
        <SlideLogo
          logoSrc={logoSrc}
          tone={isLight ? "onLight" : "onDark"}
          imgClassName="h-9 opacity-90"
        />

        <div className="relative z-10 flex h-full flex-col px-14 pb-16 pt-20">
          <h2
            className="mb-8 font-bold"
            style={{
              fontSize: titleSize,
              color: template.colors.title,
              fontFamily: template.fonts.display,
            }}
          >
            Ringkasan
          </h2>

          <div
            className={`flex flex-1 flex-col overflow-hidden ${distribute}`}
            style={{ gap: distribute === "justify-between" ? undefined : gap }}
          >
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="leading-snug"
                style={{
                  fontSize,
                  color: template.colors.body,
                  fontFamily: template.fonts.body,
                  borderLeft:
                    template.id === "neon-pulse" ||
                    template.id === "editorial-ink"
                      ? `3px solid ${template.colors.accent}`
                      : undefined,
                  paddingLeft:
                    template.id === "neon-pulse" ||
                    template.id === "editorial-ink"
                      ? 16
                      : undefined,
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </SlideFrame>
    );
  }
);
