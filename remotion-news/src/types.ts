export type WordTiming = {
  word: string;
  startSec: number;
  endSec: number;
};

export type NewsBeat = {
  id: string;
  role?: string;
  startSec: number;
  endSec: number;
  vo: string;
  caption: string;
  words: string[];
  wordTimings: WordTiming[];
  visual?: string;
};

export type NewsBrief = {
  version: number;
  channel: string;
  cta: string;
  title: string;
  durationSec: number;
  aspect: string;
  style: string;
  tone?: string;
  fps: number;
  width: number;
  height: number;
  voText: string;
  beats: NewsBeat[];
  sourceUrl?: string;
  audioFileName?: string;
};

export type NewsMotionProps = {
  brief: NewsBrief;
  audioSrc: string | null;
};
