"use client";

import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import { StorySlide } from "@/components/slides/story-slide";
import { fetchImageAsDataUrl, STORY_SIZE } from "@/lib/aspect";
import { DEFAULT_FONT_SCALE } from "@/lib/font-scale";
import type { DesignTemplate } from "@/lib/templates";

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

async function prepareLogo(logoSrc: string | null): Promise<string | null> {
  if (!logoSrc) return null;
  if (logoSrc.startsWith("data:") || logoSrc.startsWith("/")) return logoSrc;
  try {
    return await fetchImageAsDataUrl(logoSrc, "logo-story");
  } catch {
    return logoSrc;
  }
}

export async function captureStoryToPngDataUrl(options: {
  title: string;
  imageUrl: string | null;
  logoSrc: string | null;
  generationKey: string;
  template: DesignTemplate;
  coverLabel: string;
  titleHighlights?: string[] | null;
  fontScale?: number;
}): Promise<string> {
  const {
    title,
    imageUrl,
    logoSrc,
    generationKey,
    template,
    coverLabel,
    titleHighlights,
    fontScale = DEFAULT_FONT_SCALE,
  } = options;

  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  let preparedImage = imageUrl;
  if (imageUrl && !imageUrl.startsWith("data:")) {
    preparedImage = await fetchImageAsDataUrl(
      imageUrl,
      `${generationKey}::story`
    );
  }

  const readyLogo = await prepareLogo(logoSrc);
  const size = STORY_SIZE;

  const host = document.createElement("div");
  host.setAttribute("data-capture-host", "story");
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
        <StorySlide
          title={title}
          imageUrl={preparedImage}
          logoSrc={readyLogo}
          template={template}
          coverLabel={coverLabel}
          titleHighlights={titleHighlights}
          fontScale={fontScale}
          ref={(el) => {
            nodeBox.current = el;
          }}
        />
      );
    });

    await waitForPaint();
    const node = nodeBox.current;
    if (!node) {
      throw new Error("Gagal merender Story.");
    }

    if (preparedImage?.startsWith("data:")) {
      const bg = node.querySelector("img");
      if (bg) {
        bg.setAttribute("src", preparedImage);
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
