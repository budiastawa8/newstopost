"use client";

import {
  FREE_DESIGNS,
  type FreeDesignId,
} from "@/lib/free-designs";
import { cn } from "@/lib/utils";

export interface FreeDesignPickerProps {
  value: FreeDesignId;
  disabled?: boolean;
  onChange: (id: FreeDesignId) => void;
}

export function FreeDesignPicker({
  value,
  disabled,
  onChange,
}: FreeDesignPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-900">Desain</p>
      <div className="grid gap-2">
        {FREE_DESIGNS.map((design) => {
          const active = design.id === value;
          return (
            <button
              key={design.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(design.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors disabled:opacity-50",
                active
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              )}
            >
              <div className="mb-2 flex gap-1.5">
                {design.swatch.map((color) => (
                  <span
                    key={color}
                    className="h-3 w-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-zinc-900">{design.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{design.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
