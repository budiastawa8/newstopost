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
  /** Remote URL from NewsToPost brief. */
  imageUrl?: string | null;
  /** Local file under public/ after render download (e.g. media/beat-hook.jpg). */
  imageSrc?: string | null;
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
  images?: string[];
  beats: NewsBeat[];
  sourceUrl?: string;
  audioFileName?: string;
};

export type NewsMotionProps = {
  brief: NewsBrief;
  audioSrc: string | null;
};
