"use client";

import {
  categoryLabel,
  FREE_DESIGNS,
  getFreeDesign,
  type FreeDesignCategory,
  type FreeDesignId,
} from "@/lib/free-designs";
import { Label } from "@/components/ui/label";

export interface FreeDesignPickerProps {
  value: FreeDesignId;
  disabled?: boolean;
  onChange: (id: FreeDesignId) => void;
}

const CATEGORY_ORDER: FreeDesignCategory[] = ["quote", "promo", "poster"];

export function FreeDesignPicker({
  value,
  disabled,
  onChange,
}: FreeDesignPickerProps) {
  const selected = getFreeDesign(value);

  return (
    <div className="space-y-2">
      <Label htmlFor="free-design-select">Desain</Label>
      <select
        id="free-design-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as FreeDesignId)}
        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {CATEGORY_ORDER.map((category) => {
          const items = FREE_DESIGNS.filter((d) => d.category === category);
          if (items.length === 0) return null;
          return (
            <optgroup key={category} label={categoryLabel(category)}>
              {items.map((design) => (
                <option key={design.id} value={design.id}>
                  {design.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>

      <div className="flex items-start gap-3 rounded-md border border-zinc-100 bg-zinc-50/80 px-3 py-2">
        <div className="flex gap-1.5 pt-0.5">
          {selected.swatch.map((color) => (
            <span
              key={`${selected.id}-${color}`}
              className="h-3 w-3 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-zinc-500">
          <span className="font-medium text-zinc-700">{selected.name}</span>
          {" · "}
          {selected.description}
        </p>
      </div>
    </div>
  );
}
