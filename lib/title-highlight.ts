export type TitleSegment = {
  text: string;
  highlighted: boolean;
};

export type TitleWordSpan = {
  index: number;
  text: string;
  start: number;
  end: number;
};

/** Token kata (non-whitespace) beserta posisi di judul. */
export function getTitleWordSpans(title: string): TitleWordSpan[] {
  const spans: TitleWordSpan[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = re.exec(title)) !== null) {
    spans.push({
      index,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
    index += 1;
  }
  return spans;
}

/** Gabungkan indeks kata terpilih jadi frasa substring judul (run berurutan). */
export function phrasesFromSelectedWordIndexes(
  title: string,
  selectedIndexes: Iterable<number>
): string[] {
  const spans = getTitleWordSpans(title);
  if (spans.length === 0) return [];

  const selected = [...new Set(selectedIndexes)]
    .filter((i) => i >= 0 && i < spans.length)
    .sort((a, b) => a - b);

  const phrases: string[] = [];
  let run: number[] = [];

  const flush = () => {
    if (run.length === 0) return;
    const first = spans[run[0]!]!;
    const last = spans[run[run.length - 1]!]!;
    phrases.push(title.slice(first.start, last.end));
    run = [];
  };

  for (const i of selected) {
    if (run.length === 0 || i === run[run.length - 1]! + 1) {
      run.push(i);
    } else {
      flush();
      run.push(i);
    }
  }
  flush();
  return phrases;
}

/** Dari frasa highlight → set indeks kata (untuk UI). */
export function selectedWordIndexesFromPhrases(
  title: string,
  phrases: string[] | null | undefined
): Set<number> {
  const spans = getTitleWordSpans(title);
  const selected = new Set<number>();
  if (!phrases?.length) return selected;

  const lowerTitle = title.toLowerCase();
  for (const phrase of phrases) {
    const needle = phrase.trim().toLowerCase();
    if (!needle) continue;
    const at = lowerTitle.indexOf(needle);
    if (at === -1) continue;
    const end = at + needle.length;
    for (const span of spans) {
      if (span.start >= at && span.end <= end) {
        selected.add(span.index);
      }
    }
  }
  return selected;
}

/**
 * Pecah judul menjadi segmen biasa / highlight.
 * Frasa lebih panjang diprioritaskan; tidak saling overlap.
 */
export function buildTitleSegments(
  title: string,
  highlights: string[] | null | undefined
): TitleSegment[] {
  if (!title) return [];
  if (!highlights || highlights.length === 0) {
    return [{ text: title, highlighted: false }];
  }

  const lowerTitle = title.toLowerCase();
  const phrases = [...new Set(highlights.map((h) => h.trim()).filter(Boolean))]
    .filter((h) => lowerTitle.includes(h.toLowerCase()))
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  if (phrases.length === 0) {
    return [{ text: title, highlighted: false }];
  }

  type Match = { start: number; end: number };
  const matches: Match[] = [];

  for (const phrase of phrases) {
    const needle = phrase.toLowerCase();
    let from = 0;
    while (from < lowerTitle.length) {
      const idx = lowerTitle.indexOf(needle, from);
      if (idx === -1) break;
      const end = idx + needle.length;
      const overlaps = matches.some((m) => !(end <= m.start || idx >= m.end));
      if (!overlaps) {
        matches.push({ start: idx, end });
        break; // satu kemunculan per frasa
      }
      from = idx + 1;
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const segments: TitleSegment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({
        text: title.slice(cursor, match.start),
        highlighted: false,
      });
    }
    segments.push({
      text: title.slice(match.start, match.end),
      highlighted: true,
    });
    cursor = match.end;
  }
  if (cursor < title.length) {
    segments.push({ text: title.slice(cursor), highlighted: false });
  }

  return segments.length > 0 ? segments : [{ text: title, highlighted: false }];
}

/** Filter highlight agar hanya substring judul (case-insensitive). */
export function filterTitleHighlights(
  raw: unknown,
  title: string
): string[] {
  if (!Array.isArray(raw) || !title.trim()) return [];
  const lower = title.toLowerCase();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const phrase = item.trim();
    if (phrase.length < 2 || phrase.length > 80) continue;
    if (!lower.includes(phrase.toLowerCase())) continue;
    if (out.some((p) => p.toLowerCase() === phrase.toLowerCase())) continue;
    out.push(phrase);
    if (out.length >= 3) break;
  }
  return out;
}
