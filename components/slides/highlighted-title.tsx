"use client";

import type { CSSProperties } from "react";
import { buildTitleSegments } from "@/lib/title-highlight";

export interface HighlightedTitleProps {
  title: string;
  highlights?: string[] | null;
  highlightBg: string;
  highlightFg: string;
  className?: string;
  style?: CSSProperties;
}

export function HighlightedTitle({
  title,
  highlights,
  highlightBg,
  highlightFg,
  className,
  style,
}: HighlightedTitleProps) {
  const segments = buildTitleSegments(title, highlights);

  return (
    <h2 className={className} style={style}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <span
            key={index}
            style={{
              backgroundColor: highlightBg,
              color: highlightFg,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              padding: "0.05em 0.14em",
              borderRadius: "0.12em",
            }}
          >
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </h2>
  );
}
