"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CoverSlide } from "@/components/slides/cover-slide";
import { PhotoSlide } from "@/components/slides/photo-slide";
import { SummarySlide } from "@/components/slides/summary-slide";
import { Button } from "@/components/ui/button";
import { getAspectSize } from "@/lib/aspect";
import { captureSlidesToPngDataUrls } from "@/lib/capture-slides";
import type { DesignTemplate } from "@/lib/templates";
import type { AspectRatio, AspectSize, SlideModel } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CarouselPreviewHandle {
  capturePngDataUrls: () => Promise<string[]>;
}

export interface CarouselPreviewProps {
  slides: SlideModel[];
  aspect: AspectRatio;
  logoSrc: string | null;
  generationKey: string;
  template: DesignTemplate;
  coverLabel: string;
  /** Override lebar preview (px). Default: isi lebar kartu. */
  previewWidth?: number;
}

function renderSlide(
  slide: SlideModel,
  size: AspectSize,
  logoSrc: string | null,
  imageCacheKey: string,
  template: DesignTemplate,
  coverLabel: string
) {
  if (slide.kind === "cover") {
    return (
      <CoverSlide
        slide={slide}
        size={size}
        logoSrc={logoSrc}
        template={template}
        coverLabel={coverLabel}
        imageCacheKey={imageCacheKey}
      />
    );
  }
  if (slide.kind === "summary") {
    return (
      <SummarySlide
        slide={slide}
        size={size}
        logoSrc={logoSrc}
        template={template}
      />
    );
  }
  return (
    <PhotoSlide
      slide={slide}
      size={size}
      logoSrc={logoSrc}
      template={template}
      imageCacheKey={imageCacheKey}
    />
  );
}

export const CarouselPreview = forwardRef<
  CarouselPreviewHandle,
  CarouselPreviewProps
>(function CarouselPreview(
  {
    slides,
    aspect,
    logoSrc,
    generationKey,
    template,
    coverLabel,
    previewWidth: previewWidthProp,
  },
  ref
) {
  const size = useMemo(() => getAspectSize(aspect), [aspect]);
  const shellRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(360);
  const previewWidth = previewWidthProp ?? measuredWidth;
  const scale = previewWidth / size.width;
  const slidesRef = useRef(slides);
  const logoRef = useRef(logoSrc);
  const keyRef = useRef(generationKey);
  const templateRef = useRef(template);
  const coverLabelRef = useRef(coverLabel);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  useEffect(() => {
    if (previewWidthProp != null) return;
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = el.clientWidth;
      // Isi lebar kartu preview; batas atas biar tidak terlalu besar di desktop
      setMeasuredWidth(Math.max(280, Math.min(w, 440)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewWidthProp]);

  slidesRef.current = slides;
  logoRef.current = logoSrc;
  keyRef.current = generationKey;
  templateRef.current = template;
  coverLabelRef.current = coverLabel;

  useEffect(() => {
    setActiveIndex(0);
  }, [generationKey]);

  useImperativeHandle(
    ref,
    () => ({
      capturePngDataUrls: async () => {
        setIsCapturing(true);
        try {
          const snapshot = slidesRef.current.map((slide) =>
            structuredClone(slide)
          );
          return await captureSlidesToPngDataUrls({
            slides: snapshot,
            size,
            logoSrc: logoRef.current,
            generationKey: keyRef.current,
            template: templateRef.current,
            coverLabel: coverLabelRef.current,
          });
        } finally {
          setIsCapturing(false);
        }
      },
    }),
    [size]
  );

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      const next = ((index % slides.length) + slides.length) % slides.length;
      setActiveIndex(next);
    },
    [slides.length]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isCapturing) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, isCapturing]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isCapturing) return;
    dragStartX.current = event.clientX;
    dragDeltaX.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    dragDeltaX.current = event.clientX - dragStartX.current;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    dragStartX.current = null;
    dragDeltaX.current = 0;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    if (Math.abs(delta) < 48) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  if (slides.length === 0) return null;

  const previewSlide = slides[activeIndex];
  const previewHeight = size.height * scale;

  return (
    <div ref={shellRef} className="relative flex w-full flex-col items-center gap-4">
      {isCapturing ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/80 text-sm font-medium text-zinc-700 backdrop-blur-sm">
          Menyusun PNG sesuai preview…
        </div>
      ) : null}

      <div className="flex w-full items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-600">
          Slide {activeIndex + 1} / {slides.length}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Slide sebelumnya"
            onClick={goPrev}
            disabled={slides.length <= 1 || isCapturing}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Slide berikutnya"
            onClick={goNext}
            disabled={slides.length <= 1 || isCapturing}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="relative touch-pan-y select-none"
        style={{ width: previewWidth, height: previewHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
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
            {renderSlide(
              previewSlide,
              size,
              logoSrc,
              generationKey,
              template,
              coverLabel
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={`dot-${generationKey}-${slide.kind}-${index}`}
            type="button"
            aria-label={`Ke slide ${index + 1}`}
            disabled={isCapturing}
            onClick={() => goTo(index)}
            className={cn(
              "h-2.5 rounded-full transition-all",
              index === activeIndex
                ? "w-6 bg-zinc-900"
                : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
            )}
          />
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Geser kiri/kanan, panah keyboard, atau tombol navigasi
      </p>
    </div>
  );
});
