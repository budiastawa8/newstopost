"use client";

import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  clearStoredLogo,
  isAllowedLogoFile,
  readLogoFileAsDataUrl,
  resolveLogoSrc,
  saveStoredLogo,
} from "@/lib/logo-storage";

export interface LogoUploaderProps {
  logoSrc: string | null;
  disabled?: boolean;
  onLogoChange: (dataUrl: string | null) => void;
  onError: (message: string | null) => void;
}

export function LogoUploader({
  logoSrc,
  disabled,
  onLogoChange,
  onError,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = resolveLogoSrc(logoSrc);
  const hasCustom = Boolean(logoSrc);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = isAllowedLogoFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    try {
      const dataUrl = await readLogoFileAsDataUrl(file);
      saveStoredLogo(dataUrl);
      onLogoChange(dataUrl);
      onError(null);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Gagal mengunggah logo."
      );
    }
  }

  function handleClear() {
    clearStoredLogo();
    onLogoChange(null);
    onError(null);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="brand-logo">Logo brand</Label>
      <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Preview logo"
            className="max-h-10 max-w-10 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm text-zinc-700">
            {hasCustom ? "Logo kustom tersimpan di browser ini" : "Belum ada logo kustom"}
          </p>
          <p className="text-xs text-zinc-500">PNG, JPG, WEBP, SVG · maks 2 MB</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id="brand-logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          disabled={disabled}
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Unggah logo
        </Button>
        {hasCustom ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={handleClear}
          >
            Hapus
          </Button>
        ) : null}
      </div>
    </div>
  );
}
