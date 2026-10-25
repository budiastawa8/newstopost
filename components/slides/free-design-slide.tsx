"use client";

import { forwardRef, type CSSProperties } from "react";
import { HighlightedTitle } from "@/components/slides/highlighted-title";
import { SlideFrame } from "@/components/slides/slide-frame";
import { SlideLogo } from "@/components/slides/slide-logo";
import type { FreeDesignPreset } from "@/lib/free-designs";
import type { AspectSize, FreeDesignLayout } from "@/lib/types";

export interface FreeDesignSlideProps {
  design: FreeDesignPreset;
  size: AspectSize;
  imageUrl: string | null;
  headline: string;
  subtext?: string;
  logoSrc: string | null;
  titleHighlights?: string[] | null;
  layout?: FreeDesignLayout | null;
}

const DEFAULT_LAYOUT: FreeDesignLayout = { fontScale: 1, shiftY: 0 };

export const FreeDesignSlide = forwardRef<HTMLDivElement, FreeDesignSlideProps>(
  function FreeDesignSlide(
    {
      design,
      size,
      imageUrl,
      headline,
      subtext,
      logoSrc,
      titleHighlights,
      layout: layoutProp,
    },
    ref
  ) {
    const layout = layoutProp ?? DEFAULT_LAYOUT;
    const fontScale = Math.min(1.45, Math.max(0.7, layout.fontScale || 1));
    const shiftY = Math.min(220, Math.max(-220, layout.shiftY || 0));
    const sx = (n: number) => Math.round(n * fontScale);
    const shiftStyle: CSSProperties | undefined =
      shiftY !== 0 ? { transform: `translateY(${shiftY}px)` } : undefined;

    const isTall = size.height >= 1800;
    const isSquare = size.height === size.width;
    const titleSize = sx(isTall ? 72 : isSquare ? 52 : 58);
    const quoteSize = sx(isTall ? 56 : isSquare ? 42 : 46);

    const photo = imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        crossOrigin="anonymous"
        loading="eager"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-cover"
      />
    ) : (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${design.swatch[0]}, ${design.swatch[2]})`,
        }}
      />
    );

    if (design.id === "quote-linen") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          <div className="absolute inset-x-0 top-0 bottom-[38%] overflow-hidden">
            {photo}
          </div>
          <SlideLogo logoSrc={logoSrc} tone="onDark" className="right-10 top-10" />
          <div
            data-fd-copy
            className="absolute inset-x-0 bottom-0 flex flex-col justify-center px-14 py-16"
            style={{
              height: "42%",
              background: design.colors.card,
              fontFamily: design.fonts.body,
              ...shiftStyle,
            }}
          >
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: design.colors.accent }}
            >
              Quote
            </p>
            <HighlightedTitle
              title={headline || "Tulis quote Anda di sini"}
              highlights={titleHighlights}
              highlightBg={design.colors.highlightBg}
              highlightFg={design.colors.highlightFg}
              className="font-semibold leading-snug"
              style={{
                fontSize: quoteSize,
                fontFamily: design.fonts.display,
                color: design.colors.text,
              }}
            />
            {subtext?.trim() ? (
              <p
                className="mt-6 leading-relaxed"
                style={{
                  fontSize: sx(18),
                  color: design.colors.muted,
                  fontFamily: design.fonts.body,
                }}
              >
                {subtext.trim()}
              </p>
            ) : null}
          </div>
        </SlideFrame>
      );
    }

    if (design.id === "quote-glass") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          {photo}
          <div
            className="absolute inset-0"
            style={{ background: design.colors.overlay }}
          />
          <SlideLogo logoSrc={logoSrc} tone="onDark" />
          <div
            data-fd-copy
            className="absolute inset-0 z-10 flex items-center justify-center p-14"
            style={shiftStyle}
          >
            <div
              className="w-full max-w-[88%] rounded-3xl px-12 py-14 shadow-2xl ring-1 ring-white/40 backdrop-blur-md"
              style={{ background: design.colors.card }}
            >
              <p
                className="mb-5 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: design.colors.accent }}
              >
                Quote
              </p>
              <HighlightedTitle
                title={headline || "Tulis quote Anda di sini"}
                highlights={titleHighlights}
                highlightBg={design.colors.highlightBg}
                highlightFg={design.colors.highlightFg}
                className="font-bold leading-snug"
                style={{
                  fontSize: sx(isSquare ? 40 : 44),
                  fontFamily: design.fonts.display,
                  color: design.colors.text,
                }}
              />
              {subtext?.trim() ? (
                <p
                  className="mt-6 leading-relaxed"
                  style={{ fontSize: sx(16), color: design.colors.muted }}
                >
                  {subtext.trim()}
                </p>
              ) : null}
            </div>
          </div>
        </SlideFrame>
      );
    }

    if (design.id === "quote-serif-light") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          {photo}
          <div
            className="absolute inset-0"
            style={{ background: design.colors.overlay }}
          />
          <SlideLogo logoSrc={logoSrc} tone="onLight" />
          <div
            data-fd-copy
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-16 text-center"
            style={shiftStyle}
          >
            <span
              className="mb-8 leading-none"
              style={{
                fontSize: sx(48),
                color: design.colors.accent,
                fontFamily: design.fonts.display,
              }}
            >
              “
            </span>
            <HighlightedTitle
              title={headline || "Tulis quote Anda di sini"}
              highlights={titleHighlights}
              highlightBg={design.colors.highlightBg}
              highlightFg={design.colors.highlightFg}
              className="max-w-[92%] font-medium leading-snug"
              style={{
                fontSize: quoteSize,
                fontFamily: design.fonts.display,
                color: design.colors.text,
                textAlign: "center",
              }}
            />
            {subtext?.trim() ? (
              <p
                className="mt-8 tracking-wide"
                style={{ fontSize: sx(16), color: design.colors.muted }}
              >
                — {subtext.trim()}
              </p>
            ) : null}
          </div>
        </SlideFrame>
      );
    }

    if (design.id === "quote-split") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          <div className="absolute inset-x-0 top-0 h-[48%] overflow-hidden">
            {photo}
          </div>
          <SlideLogo logoSrc={logoSrc} tone="onDark" className="right-10 top-10" />
          <div
            data-fd-copy
            className="absolute inset-x-0 bottom-0 flex flex-col justify-center px-14 py-14"
            style={{
              height: "54%",
              background: design.colors.card,
              ...shiftStyle,
            }}
          >
            <div
              className="mb-6 h-1 w-14 rounded-full"
              style={{ background: design.colors.accent }}
            />
            <HighlightedTitle
              title={headline || "Tulis quote Anda di sini"}
              highlights={titleHighlights}
              highlightBg={design.colors.highlightBg}
              highlightFg={design.colors.highlightFg}
              className="font-bold leading-snug"
              style={{
                fontSize: sx(isSquare ? 38 : 44),
                fontFamily: design.fonts.display,
                color: design.colors.text,
              }}
            />
            {subtext?.trim() ? (
              <p
                className="mt-6"
                style={{
                  fontSize: sx(18),
                  color: design.colors.muted,
                  fontFamily: design.fonts.body,
                }}
              >
                {subtext.trim()}
              </p>
            ) : null}
          </div>
        </SlideFrame>
      );
    }

    if (design.id === "editorial-bar") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          {photo}
          <div
            className="absolute inset-0"
            style={{ background: design.colors.overlay }}
          />
          <SlideLogo logoSrc={logoSrc} />
          <div
            data-fd-copy
            className="absolute inset-x-0 bottom-0 z-10 px-14 pb-16 pt-40"
            style={shiftStyle}
          >
            <div
              className="mb-6 h-1.5 w-24 rounded-full"
              style={{ background: design.colors.accent }}
            />
            <HighlightedTitle
              title={headline || "Judul poster Anda"}
              highlights={titleHighlights}
              highlightBg={design.colors.highlightBg}
              highlightFg={design.colors.highlightFg}
              className="font-bold uppercase leading-[1.05] tracking-tight"
              style={{
                fontSize: titleSize,
                fontFamily: design.fonts.display,
                color: design.colors.text,
              }}
            />
            {subtext?.trim() ? (
              <p
                className="mt-5 max-w-[92%] leading-snug"
                style={{
                  fontSize: sx(20),
                  color: design.colors.muted,
                  fontFamily: design.fonts.body,
                }}
              >
                {subtext.trim()}
              </p>
            ) : null}
          </div>
        </SlideFrame>
      );
    }

    if (design.id === "promo-badge") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          {photo}
          <div
            className="absolute inset-0"
            style={{ background: design.colors.overlay }}
          />
          <SlideLogo logoSrc={logoSrc} />
          <div
            data-fd-copy
            className="absolute inset-x-0 bottom-0 z-10 px-14 pb-16 pt-36"
            style={shiftStyle}
          >
            <span
              className="mb-5 inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white"
              style={{ background: design.colors.accent }}
            >
              Promo
            </span>
            <HighlightedTitle
              title={headline || "Judul promo Anda"}
              highlights={titleHighlights}
              highlightBg={design.colors.highlightBg}
              highlightFg={design.colors.highlightFg}
              className="font-bold leading-tight"
              style={{
                fontSize: titleSize - sx(4),
                fontFamily: design.fonts.display,
                color: design.colors.text,
              }}
            />
            {subtext?.trim() ? (
              <p
                className="mt-5 font-medium"
                style={{ fontSize: sx(20), color: design.colors.muted }}
              >
                {subtext.trim()}
              </p>
            ) : null}
          </div>
        </SlideFrame>
      );
    }

    if (design.id === "promo-deal") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          {photo}
          <div
            className="absolute inset-0"
            style={{ background: design.colors.overlay }}
          />
          <SlideLogo logoSrc={logoSrc} tone="onDark" />
          <div
            data-fd-copy
            className="absolute inset-0 z-10 flex items-end justify-center p-12 pb-14"
            style={shiftStyle}
          >
            <div
              className="w-full rounded-[2rem] px-12 py-12 shadow-2xl"
              style={{ background: design.colors.card }}
            >
              <p
                className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
                style={{ color: design.colors.accent }}
              >
                Special deal
              </p>
              <HighlightedTitle
                title={headline || "Penawaran Anda"}
                highlights={titleHighlights}
                highlightBg={design.colors.highlightBg}
                highlightFg={design.colors.highlightFg}
                className="font-bold uppercase leading-[0.95] tracking-wide"
                style={{
                  fontSize: sx(isSquare ? 56 : 62),
                  fontFamily: design.fonts.display,
                  color: design.colors.text,
                }}
              />
              {subtext?.trim() ? (
                <p
                  className="mt-5 font-semibold"
                  style={{ fontSize: sx(18), color: design.colors.muted }}
                >
                  {subtext.trim()}
                </p>
              ) : null}
            </div>
          </div>
        </SlideFrame>
      );
    }

    if (design.id === "promo-soft") {
      return (
        <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
          <div className="absolute inset-x-0 top-0 h-[55%] overflow-hidden">
            {photo}
          </div>
          <SlideLogo logoSrc={logoSrc} tone="onDark" className="right-10 top-10" />
          <div
            data-fd-copy
            className="absolute inset-x-0 bottom-0 flex flex-col justify-center px-14 py-14"
            style={{
              height: "48%",
              background: design.colors.card,
              ...shiftStyle,
            }}
          >
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: design.colors.accent }}
            >
              Promo
            </p>
            <HighlightedTitle
              title={headline || "Judul promo lembut"}
              highlights={titleHighlights}
              highlightBg={design.colors.highlightBg}
              highlightFg={design.colors.highlightFg}
              className="font-semibold leading-snug"
              style={{
                fontSize: sx(isSquare ? 40 : 46),
                fontFamily: design.fonts.display,
                color: design.colors.text,
              }}
            />
            {subtext?.trim() ? (
              <p
                className="mt-5 leading-relaxed"
                style={{ fontSize: sx(16), color: design.colors.muted }}
              >
                {subtext.trim()}
              </p>
            ) : null}
          </div>
        </SlideFrame>
      );
    }

    const isImpact = design.id === "impact-story";
    return (
      <SlideFrame ref={ref} size={size} style={{ fontFamily: design.fonts.body }}>
        {photo}
        <div
          className="absolute inset-0"
          style={{ background: design.colors.overlay }}
        />
        <SlideLogo
          logoSrc={logoSrc}
          className={isImpact ? "right-12 top-14" : undefined}
          imgClassName={isImpact ? "h-11" : undefined}
        />
        <div
          data-fd-copy
          className={
            isImpact
              ? "absolute inset-x-0 bottom-0 z-10 px-16 pb-28 pt-48"
              : "absolute inset-x-0 bottom-0 z-10 px-14 pb-16 pt-40"
          }
          style={shiftStyle}
        >
          {!isImpact ? (
            <div
              className="mb-5 h-px w-16"
              style={{ background: design.colors.accent }}
            />
          ) : (
            <p
              className="mb-5 font-semibold uppercase tracking-[0.28em]"
              style={{ fontSize: sx(14), color: design.colors.accent }}
            >
              Story
            </p>
          )}
          <HighlightedTitle
            title={
              headline ||
              (isImpact ? "Judul impact Anda" : "Tulis quote Anda di sini")
            }
            highlights={titleHighlights}
            highlightBg={design.colors.highlightBg}
            highlightFg={design.colors.highlightFg}
            className={
              isImpact
                ? "font-bold uppercase leading-[0.95] tracking-wide"
                : "font-semibold leading-snug"
            }
            style={{
              fontSize: isImpact ? titleSize : quoteSize,
              fontFamily: design.fonts.display,
              color: design.colors.text,
            }}
          />
          {subtext?.trim() ? (
            <p
              className="mt-6 leading-relaxed"
              style={{
                fontSize: sx(18),
                color: design.colors.muted,
                fontFamily: design.fonts.body,
              }}
            >
              {subtext.trim()}
            </p>
          ) : null}
        </div>
      </SlideFrame>
    );
  }
);
