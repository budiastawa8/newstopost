"use client";

import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import { CoverSlide } from "@/components/slides/cover-slide";
import { PhotoSlide } from "@/components/slides/photo-slide";
import { SummarySlide } from "@/components/slides/summary-slide";
import { fetchImageAsDataUrl } from "@/lib/aspect";
import { DEFAULT_FONT_SCALE } from "@/lib/font-scale";
import type { DesignTemplate } from "@/lib/templates";
import type { AspectSize, SlideModel } from "@/lib/types";

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function waitForDataUrlImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            img.decode().then(() => resolve()).catch(() => resolve());
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

async function prepareSlideForCapture(
  slide: SlideModel,
  cacheKey: string,
  index: number
): Promise<SlideModel> {
  const key = `${cacheKey}::${index}`;

  if (slide.kind === "cover") {
    if (!slide.imageUrl) return slide;
    const dataUrl = await fetchImageAsDataUrl(slide.imageUrl, key);
    return { ...slide, imageUrl: dataUrl };
  }

  if (slide.kind === "photo") {
    const dataUrl = await fetchImageAsDataUrl(slide.imageUrl, key);
    return { ...slide, imageUrl: dataUrl };
  }

  return slide;
}

async function prepareLogo(logoSrc: string | null): Promise<string | null> {
  if (!logoSrc) return null;
  if (logoSrc.startsWith("data:") || logoSrc.startsWith("/")) return logoSrc;
  try {
    return await fetchImageAsDataUrl(logoSrc, "logo");
  } catch {
    return logoSrc;
  }
}

function renderSlideElement(
  slide: SlideModel,
  size: AspectSize,
  logoSrc: string | null,
  template: DesignTemplate,
  coverLabel: string,
  fontScale: number,
  setRef: (el: HTMLElement | null) => void
) {
  if (slide.kind === "cover") {
    return (
      <CoverSlide
        slide={slide}
        size={size}
        logoSrc={logoSrc}
        template={template}
        coverLabel={coverLabel}
        fontScale={fontScale}
        ref={setRef}
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
        fontScale={fontScale}
        ref={setRef}
      />
    );
  }
  return (
    <PhotoSlide
      slide={slide}
      size={size}
      logoSrc={logoSrc}
      template={template}
      fontScale={fontScale}
      ref={setRef}
    />
  );
}

async function captureOneSlide(
  slide: SlideModel,
  size: AspectSize,
  logoSrc: string | null,
  template: DesignTemplate,
  coverLabel: string,
  fontScale: number,
  slideIndex: number
): Promise<string> {
  const host = document.createElement("div");
  host.setAttribute("data-capture-host", String(slideIndex));
  host.setAttribute(
    "data-capture-kind",
    slide.kind === "photo" ? `photo:${slide.imageUrl.slice(0, 48)}` : slide.kind
  );
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${size.width}px`,
    `height:${size.height}px`,
    "z-index:2147483000",
    "opacity:1",
    "pointer-events:none",
    "overflow:hidden",
    "background:#000",
  ].join(";");
  document.body.appendChild(host);

  let root: Root | null = createRoot(host);
  const nodeBox: { current: HTMLElement | null } = { current: null };

  try {
    flushSync(() => {
      root!.render(
        renderSlideElement(
          slide,
          size,
          logoSrc,
          template,
          coverLabel,
          fontScale,
          (el) => {
            nodeBox.current = el;
          }
        )
      );
    });

    await waitForPaint();

    const node = nodeBox.current;
    if (!node) {
      throw new Error(`Gagal merender slide ${slideIndex + 1}.`);
    }

    // Paksa img background memakai data URL unik milik slide ini
    if (
      (slide.kind === "photo" || slide.kind === "cover") &&
      slide.imageUrl?.startsWith("data:")
    ) {
      const bg = node.querySelector("img");
      if (bg) {
        bg.setAttribute("src", slide.imageUrl);
        await waitForPaint();
      }
    }

    await waitForDataUrlImages(node);
    await waitForPaint();

    return await toPng(node, {
      width: size.width,
      height: size.height,
      pixelRatio: 1,
      cacheBust: false,
      skipAutoScale: true,
      style: {
        transform: "none",
        margin: "0",
        opacity: "1",
      },
    });
  } finally {
    flushSync(() => {
      root?.unmount();
    });
    root = null;
    host.remove();
  }
}

export async function captureSlidesToPngDataUrls(options: {
  slides: SlideModel[];
  size: AspectSize;
  logoSrc: string | null;
  generationKey: string;
  template: DesignTemplate;
  coverLabel: string;
  fontScale?: number;
}): Promise<string[]> {
  const {
    slides,
    size,
    logoSrc,
    generationKey,
    template,
    coverLabel,
    fontScale = DEFAULT_FONT_SCALE,
  } = options;
  if (slides.length === 0) {
    throw new Error("Tidak ada slide untuk diunduh.");
  }

  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const overlay = document.createElement("div");
  overlay.setAttribute("data-capture-overlay", "true");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483646",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "background:rgba(250,250,250,0.94)",
    "color:#3f3f46",
    "font:600 14px/1.4 system-ui,sans-serif",
  ].join(";");
  overlay.textContent = "Menyiapkan PNG sesuai preview…";
  document.body.appendChild(overlay);

  try {
    const readyLogo = await prepareLogo(logoSrc);
    const dataUrls: string[] = [];

    for (let i = 0; i < slides.length; i += 1) {
      overlay.textContent = `Menyiapkan PNG ${i + 1}/${slides.length}…`;
      const prepared = await prepareSlideForCapture(
        slides[i],
        generationKey,
        i
      );
      const dataUrl = await captureOneSlide(
        prepared,
        size,
        readyLogo,
        template,
        coverLabel,
        fontScale,
        i
      );
      dataUrls.push(dataUrl);
    }

    return dataUrls;
  } finally {
    overlay.remove();
  }
}
