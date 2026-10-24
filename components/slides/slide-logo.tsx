"use client";

import { resolveLogoSrc } from "@/lib/logo-storage";
import { cn } from "@/lib/utils";

export interface SlideLogoProps {
  logoSrc: string | null;
  className?: string;
  imgClassName?: string;
  /** onLight = latar gelap di belakang logo agar logo putih tetap terbaca */
  tone?: "onDark" | "onLight";
}

export function SlideLogo({
  logoSrc,
  className,
  imgClassName,
  tone = "onDark",
}: SlideLogoProps) {
  const src = resolveLogoSrc(logoSrc);

  return (
    <div className={cn("absolute right-10 top-10 z-10", className)}>
      <div
        className={cn(
          "flex items-center justify-center",
          tone === "onLight" &&
            "rounded-xl bg-zinc-900/88 px-4 py-3 shadow-md ring-1 ring-black/10 backdrop-blur-sm"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Logo"
          className={cn(
            "h-10 w-auto max-w-[280px] object-contain",
            imgClassName
          )}
        />
      </div>
    </div>
  );
}
