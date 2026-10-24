"use client";

import { Label } from "@/components/ui/label";
import {
  DESIGN_TEMPLATES,
  type TemplateId,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplatePickerProps {
  value: TemplateId;
  disabled?: boolean;
  onChange: (id: TemplateId) => void;
}

export function TemplatePicker({
  value,
  disabled,
  onChange,
}: TemplatePickerProps) {
  return (
    <div className="space-y-2">
      <Label>Template desain</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DESIGN_TEMPLATES.map((template) => {
          const selected = value === template.id;
          return (
            <button
              key={template.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(template.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white hover:bg-zinc-50",
                disabled && "opacity-60"
              )}
            >
              <div className="mb-2 flex gap-1">
                {template.swatch.map((color) => (
                  <span
                    key={color}
                    className="h-3 w-5 rounded-sm ring-1 ring-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  selected ? "text-white" : "text-zinc-900"
                )}
              >
                {template.name}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs leading-snug",
                  selected ? "text-zinc-300" : "text-zinc-500"
                )}
              >
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
