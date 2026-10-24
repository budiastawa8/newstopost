"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AspectSize } from "@/lib/types";

export interface SlideFrameProps {
  size: AspectSize;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const SlideFrame = forwardRef<HTMLDivElement, SlideFrameProps>(
  function SlideFrame({ size, children, className, style }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-zinc-900 text-white",
          className
        )}
        style={{
          width: size.width,
          height: size.height,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);
