export type TitleSegment = {
  text: string;
  highlighted: boolean;
};

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
