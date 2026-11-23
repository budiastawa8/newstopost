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
  /** On-screen / card text (preferred). */
  onScreen?: string;
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
  /** Data URL dari NewsToPost (di-materialize ke logoSrc saat render). */
  logoDataUrl?: string | null;
  /** Path lokal di public/ (mis. media/logo.png). */
  logoSrc?: string | null;
  beats: NewsBeat[];
  sourceUrl?: string;
  audioFileName?: string;
};

export type NewsMotionProps = {
  brief: NewsBrief;
  audioSrc: string | null;
};
