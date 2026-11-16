import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { NewsBeat } from "./types";
import type { StyleTheme } from "./styleTheme";

export const KaraokeCaption: React.FC<{
  beat: NewsBeat;
  theme: StyleTheme;
}> = ({ beat, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const opacity = interpolate(
    t,
    [beat.startSec, beat.startSec + 0.18, beat.endSec - 0.12, beat.endSec],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const y = interpolate(
    t,
    [beat.startSec, beat.startSec + 0.25],
    [28, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 56px 160px",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          maxWidth: "92%",
          background: theme.card,
          border: `2px solid ${theme.accent}`,
          borderRadius: 22,
          padding: "22px 28px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 14px",
            justifyContent: "center",
            fontSize: 46,
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {beat.wordTimings.map((item) => {
            const active = t >= item.startSec && t < item.endSec;
            const spoken = t >= item.endSec;
            return (
              <span
                key={`${beat.id}-${item.word}-${item.startSec}`}
                style={{
                  color: active || spoken ? theme.karaokeActive : theme.karaokeBase,
                  textShadow: active ? `0 0 18px ${theme.accent}` : "none",
                  transform: active ? "translateY(-2px) scale(1.04)" : "none",
                  transition: "color 0.05s linear",
                }}
              >
                {item.word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
