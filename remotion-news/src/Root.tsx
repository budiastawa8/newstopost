import React from "react";
import { Composition } from "remotion";
import { DEFAULT_BRIEF } from "./defaultBrief";
import { NewsMotion } from "./NewsMotion";
import type { NewsMotionProps } from "./types";

const defaultProps: NewsMotionProps = {
  brief: DEFAULT_BRIEF,
  audioSrc: null,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NewsMotion"
        component={NewsMotion}
        durationInFrames={DEFAULT_BRIEF.durationSec * DEFAULT_BRIEF.fps}
        fps={DEFAULT_BRIEF.fps}
        width={DEFAULT_BRIEF.width}
        height={DEFAULT_BRIEF.height}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          const brief = props.brief || DEFAULT_BRIEF;
          return {
            durationInFrames: Math.max(1, Math.round(brief.durationSec * brief.fps)),
            fps: brief.fps || 30,
            width: brief.width || 1080,
            height: brief.height || 1920,
            props,
          };
        }}
      />
    </>
  );
};
