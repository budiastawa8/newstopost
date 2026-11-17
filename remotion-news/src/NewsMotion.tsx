import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Manrope";
import { KaraokeCaption } from "./KaraokeCaption";
import { themeForStyle } from "./styleTheme";
import type { NewsMotionProps } from "./types";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

function resolveImageSrc(imageSrc?: string | null) {
  const local = typeof imageSrc === "string" ? imageSrc.trim() : "";
  if (local) return staticFile(local);
  return null;
}

const BeatCard: React.FC<{
  title: string;
  subtitle: string;
  channel: string;
  theme: ReturnType<typeof themeForStyle>;
  role?: string;
  imageSrc?: string | null;
}> = ({ title, subtitle, channel, theme, role, imageSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const drift = Math.sin(frame / 28) * 8;
  const photo = resolveImageSrc(imageSrc);
  const kenBurns = interpolate(frame, [0, 90], [1.04, 1.12], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {photo ? (
        <>
          <AbsoluteFill>
            <Img
              src={photo}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${kenBurns})`,
                transformOrigin: "center center",
              }}
            />
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.35) 42%, rgba(2,6,23,0.78) 100%), radial-gradient(circle at 20% 15%, ${theme.accent}33, transparent 42%)`,
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 20% 15%, ${theme.accent}55, transparent 42%), linear-gradient(160deg, ${theme.bgA}, ${theme.bgB})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              right: -40,
              top: 180 + drift,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.accent}33, transparent 70%)`,
              filter: "blur(2px)",
            }}
          />
        </>
      )}

      <div
        style={{
          position: "absolute",
          top: 72,
          left: 56,
          right: 56,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
        }}
      >
        <div
          style={{
            background: theme.card,
            color: theme.ink,
            border: `1px solid ${theme.accent}`,
            borderRadius: 999,
            padding: "12px 22px",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "0.04em",
          }}
        >
          {channel}
        </div>
        <div
          style={{
            color: photo ? "#f8fafc" : theme.muted,
            fontWeight: 700,
            fontSize: 24,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            textShadow: photo ? "0 2px 12px rgba(0,0,0,0.45)" : undefined,
          }}
        >
          {role === "outro" ? "CTA" : role === "hook" ? "BREAKING" : "FAKTA"}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top: photo ? "52%" : "28%",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 36}px)`,
        }}
      >
        <div
          style={{
            background: theme.card,
            borderRadius: 28,
            border: `2px solid ${theme.accent}`,
            padding: "36px 34px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              color: theme.accent,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              color: theme.ink,
              fontSize: role === "hook" ? 64 : 52,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const NewsMotion: React.FC<NewsMotionProps> = ({ brief, audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = themeForStyle(brief.style || "explainer");
  const footerOpacity = interpolate(frame, [0, 20], [0, 0.9], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bgA, fontFamily }}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}

      {brief.beats.map((beat) => {
        const from = Math.round(beat.startSec * fps);
        const durationInFrames = Math.max(
          1,
          Math.round((beat.endSec - beat.startSec) * fps)
        );
        return (
          <Sequence key={beat.id} from={from} durationInFrames={durationInFrames}>
            <BeatCard
              title={beat.caption}
              subtitle={beat.visual || beat.id}
              channel={brief.channel}
              theme={theme}
              role={beat.role}
              imageSrc={beat.imageSrc}
            />
            <KaraokeCaption beat={beat} theme={theme} />
          </Sequence>
        );
      })}

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 56px 56px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            color: theme.muted,
            fontSize: 22,
            fontWeight: 600,
            opacity: footerOpacity,
          }}
        >
          Motion graphic · tanpa CapCut
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
