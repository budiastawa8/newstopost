import fs from "fs";

/** Parse edge-tts WebVTT/SRT cues into timed text units. */
export function parseWebVtt(vttText) {
  const lines = String(vttText || "").replace(/^\uFEFF/, "").split(/\r?\n/);
  const cues = [];
  let i = 0;
  const timeRe =
    /^(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line === "WEBVTT" || line.startsWith("NOTE")) {
      i += 1;
      continue;
    }
    if (/^\d+$/.test(line)) {
      i += 1;
      continue;
    }
    const m = line.match(timeRe);
    if (!m) {
      i += 1;
      continue;
    }
    const startSec = hmsToSec(m[1]);
    const endSec = hmsToSec(m[2]);
    i += 1;
    const textLines = [];
    while (i < lines.length && lines[i].trim()) {
      textLines.push(lines[i].trim());
      i += 1;
    }
    const text = textLines.join(" ").replace(/<[^>]+>/g, "").trim();
    if (text) cues.push({ startSec, endSec, text });
  }
  return cues;
}

function hmsToSec(hms) {
  const normalized = String(hms).replace(",", ".");
  const [hh, mm, rest] = normalized.split(":");
  const [ss, ms] = rest.split(".");
  return (
    Number(hh) * 3600
    + Number(mm) * 60
    + Number(ss)
    + Number(ms || 0) / 1000
  );
}

export function cuesToWordTimings(cues) {
  const words = [];
  for (const cue of cues) {
    const parts = cue.text.split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    const span = Math.max(0.05, cue.endSec - cue.startSec);
    const each = span / parts.length;
    parts.forEach((word, idx) => {
      words.push({
        word: word.replace(/[^\p{L}\p{N}\-']+/gu, "") || word,
        startSec: Number((cue.startSec + idx * each).toFixed(3)),
        endSec: Number((cue.startSec + (idx + 1) * each).toFixed(3)),
      });
    });
  }
  return words.filter((w) => w.word);
}

export function scaleBriefToDuration(brief, audioSec) {
  const target = Math.max(1, Number(audioSec) || brief.durationSec);
  const source = Math.max(0.1, Number(brief.durationSec) || target);
  const scale = target / source;
  const next = structuredClone(brief);
  next.durationSec = Number(target.toFixed(3));
  next.beats = (next.beats || []).map((beat) => {
    const startSec = Number((beat.startSec * scale).toFixed(3));
    const endSec = Number((beat.endSec * scale).toFixed(3));
    const wordTimings = (beat.wordTimings || []).map((w) => ({
      ...w,
      startSec: Number((w.startSec * scale).toFixed(3)),
      endSec: Number((w.endSec * scale).toFixed(3)),
    }));
    return { ...beat, startSec, endSec, wordTimings };
  });
  return next;
}

/** Redistribute flat word timings into existing beat windows (by overlap). */
export function applyWordTimingsToBeats(brief, wordTimings) {
  if (!wordTimings.length) return brief;
  const next = structuredClone(brief);
  const lastEnd = wordTimings[wordTimings.length - 1].endSec;
  next.durationSec = Math.max(next.durationSec, Number(lastEnd.toFixed(3)));

  next.beats = (next.beats || []).map((beat, index, arr) => {
    const startSec = beat.startSec;
    const endSec = index === arr.length - 1
      ? Math.max(beat.endSec, next.durationSec)
      : beat.endSec;
    let slice = wordTimings.filter((w) => w.startSec >= startSec && w.startSec < endSec);
    if (!slice.length) {
      slice = wordTimings.filter((w) => w.endSec > startSec && w.startSec < endSec);
    }
    if (!slice.length && beat.words?.length) {
      const span = Math.max(0.4, endSec - startSec);
      const each = span / beat.words.length;
      slice = beat.words.map((word, i) => ({
        word,
        startSec: Number((startSec + i * each).toFixed(3)),
        endSec: Number((startSec + (i + 1) * each).toFixed(3)),
      }));
    }
    const spoken = slice.map((w) => w.word).join(" ");
    return {
      ...beat,
      startSec,
      endSec: index === arr.length - 1 ? next.durationSec : endSec,
      words: slice.map((w) => w.word),
      wordTimings: slice,
      caption:
        beat.role === "hook" && beat.caption
          ? beat.caption
          : spoken || beat.caption,
    };
  });
  return next;
}

export function alignBriefWithSubtitles(brief, vttPath) {
  if (!vttPath || !fs.existsSync(vttPath)) return brief;
  const cues = parseWebVtt(fs.readFileSync(vttPath, "utf8"));
  if (!cues.length) return brief;
  const words = cuesToWordTimings(cues);
  const audioEnd = Math.max(
    brief.durationSec,
    cues[cues.length - 1].endSec,
    words[words.length - 1]?.endSec || 0,
  );
  const scaled = scaleBriefToDuration(brief, audioEnd);
  return applyWordTimingsToBeats(scaled, words);
}
