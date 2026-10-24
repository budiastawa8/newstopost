"use client";

import { useMemo } from "react";
import {
  getTitleWordSpans,
  phrasesFromSelectedWordIndexes,
  selectedWordIndexesFromPhrases,
} from "@/lib/title-highlight";
import { cn } from "@/lib/utils";

export interface TitleHighlightPickerProps {
  title: string;
  highlights: string[];
  disabled?: boolean;
  accentBg?: string;
  accentFg?: string;
  onChange: (highlights: string[]) => void;
}

/** UI minim: ketuk kata pada judul untuk on/off highlight. */
export function TitleHighlightPicker({
  title,
  highlights,
  disabled,
  accentBg = "#5eead4",
  accentFg = "#042f2e",
  onChange,
}: TitleHighlightPickerProps) {
  const words = useMemo(() => getTitleWordSpans(title), [title]);
  const selected = useMemo(
    () => selectedWordIndexesFromPhrases(title, highlights),
    [title, highlights]
  );

  if (!title.trim() || words.length === 0) return null;

  function toggleWord(index: number) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    onChange(phrasesFromSelectedWordIndexes(title, next));
  }

  function clearAll() {
    if (disabled || selected.size === 0) return;
    onChange([]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900">Highlight judul</p>
        {selected.size > 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={clearAll}
            className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline disabled:opacity-50"
          >
            Hapus
          </button>
        ) : null}
      </div>
      <p className="text-xs text-zinc-500">Ketuk kata untuk menyorot.</p>
      <div className="flex flex-wrap gap-1.5">
        {words.map((word) => {
          const on = selected.has(word.index);
          return (
            <button
              key={`${word.index}-${word.start}`}
              type="button"
              disabled={disabled}
              onClick={() => toggleWord(word.index)}
              className={cn(
                "rounded px-2 py-1 text-left text-sm font-medium transition-colors",
                "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !on && "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              )}
              style={
                on
                  ? {
                      backgroundColor: accentBg,
                      color: accentFg,
                      borderColor: accentBg,
                    }
                  : undefined
              }
            >
              {word.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
