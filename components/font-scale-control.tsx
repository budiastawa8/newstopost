"use client";

import { Label } from "@/components/ui/label";
import {
  DEFAULT_FONT_SCALE,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
  normalizeFontScale,
} from "@/lib/font-scale";
import { cn } from "@/lib/utils";

export interface FontScaleControlProps {
  value: number;
  disabled?: boolean;
  id?: string;
  onChange: (value: number) => void;
}

export function FontScaleControl({
  value,
  disabled,
  id = "font-scale",
  onChange,
}: FontScaleControlProps) {
  const scale = normalizeFontScale(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>Ukuran teks</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-zinc-500">
            {Math.round(scale * 100)}%
          </span>
          {scale !== DEFAULT_FONT_SCALE ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(DEFAULT_FONT_SCALE)}
              className="text-xs text-zinc-500 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={Math.round(MIN_FONT_SCALE * 100)}
        max={Math.round(MAX_FONT_SCALE * 100)}
        step={1}
        disabled={disabled}
        value={Math.round(scale * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className={cn("w-full accent-zinc-900", disabled && "opacity-50")}
      />
      <p className="text-xs text-zinc-500">
        Mempengaruhi judul cover, ringkasan, caption foto, dan Story.
      </p>
    </div>
  );
}
