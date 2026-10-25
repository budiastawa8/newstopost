"use client";

import { Label } from "@/components/ui/label";
import type { FreeDesignLayout } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FreeDesignLayoutControlsProps {
  layout: FreeDesignLayout;
  disabled?: boolean;
  onChange: (layout: FreeDesignLayout) => void;
}

export function FreeDesignLayoutControls({
  layout,
  disabled,
  onChange,
}: FreeDesignLayoutControlsProps) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900">Editor teks</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ fontScale: 1, shiftY: 0 })}
          className="text-xs text-zinc-500 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Reset
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Geser blok teks di preview, atau pakai slider di bawah.
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="fd-font-scale">Ukuran teks</Label>
          <span className="text-xs tabular-nums text-zinc-500">
            {Math.round(layout.fontScale * 100)}%
          </span>
        </div>
        <input
          id="fd-font-scale"
          type="range"
          min={70}
          max={145}
          step={1}
          disabled={disabled}
          value={Math.round(layout.fontScale * 100)}
          onChange={(e) =>
            onChange({
              ...layout,
              fontScale: Number(e.target.value) / 100,
            })
          }
          className={cn(
            "w-full accent-zinc-900",
            disabled && "opacity-50"
          )}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="fd-shift-y">Posisi vertikal</Label>
          <span className="text-xs tabular-nums text-zinc-500">
            {layout.shiftY > 0 ? `+${layout.shiftY}` : layout.shiftY}px
          </span>
        </div>
        <input
          id="fd-shift-y"
          type="range"
          min={-220}
          max={220}
          step={2}
          disabled={disabled}
          value={layout.shiftY}
          onChange={(e) =>
            onChange({
              ...layout,
              shiftY: Number(e.target.value),
            })
          }
          className={cn(
            "w-full accent-zinc-900",
            disabled && "opacity-50"
          )}
        />
      </div>
    </div>
  );
}
