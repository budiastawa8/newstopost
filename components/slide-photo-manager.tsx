"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { proxiedImageUrl } from "@/lib/aspect";
import {
  getCoverImageUrl,
  getPhotoSlideUrls,
  sameImageUrl,
  unusedImages,
} from "@/lib/slide-photos";
import type { SlideModel } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SlidePhotoManagerProps {
  slides: SlideModel[];
  imagePool: string[];
  generationKey?: string;
  disabled?: boolean;
  onSetCover: (imageUrl: string) => void;
  onMovePhoto: (photoOrdinal: number, direction: -1 | 1) => void;
  onSetPhoto: (photoOrdinal: number, imageUrl: string) => void;
}

function Thumb({
  url,
  cacheKey,
  selected,
  disabled,
  label,
  onClick,
}: {
  url: string;
  cacheKey?: string;
  selected?: boolean;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  const src = proxiedImageUrl(url, cacheKey);
  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={cn(
        "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-zinc-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        selected
          ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-1"
          : "border-zinc-200",
        onClick && !disabled
          ? "hover:border-zinc-400"
          : "cursor-default disabled:opacity-100",
        disabled && onClick ? "disabled:cursor-not-allowed disabled:opacity-50" : null
      )}
      title={label}
      aria-label={label}
      aria-pressed={selected}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-[10px] text-zinc-400">
          —
        </span>
      )}
      {selected ? (
        <span className="absolute inset-x-0 bottom-0 bg-zinc-900/80 px-0.5 py-0.5 text-center text-[9px] font-medium text-white">
          Cover
        </span>
      ) : null}
    </button>
  );
}

/** Pilih foto cover, ganti isi slide foto, dan atur urutan slide foto. */
export function SlidePhotoManager({
  slides,
  imagePool,
  generationKey,
  disabled,
  onSetCover,
  onMovePhoto,
  onSetPhoto,
}: SlidePhotoManagerProps) {
  const [replaceOrdinal, setReplaceOrdinal] = useState<number | null>(null);

  const coverUrl = getCoverImageUrl(slides);
  const photoUrls = getPhotoSlideUrls(slides);
  const leftover = unusedImages(imagePool, slides);

  if (imagePool.length === 0 && !coverUrl && photoUrls.length === 0) {
    return null;
  }

  const replaceCandidates =
    replaceOrdinal === null
      ? []
      : imagePool.filter(
          (url) => !sameImageUrl(url, photoUrls[replaceOrdinal] ?? null)
        );

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">Atur foto</p>
        <p className="text-xs text-zinc-500">
          Pilih cover, ganti foto slide, atau ubah urutan slide foto.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Cover
        </p>
        <div className="flex flex-wrap gap-2">
          {imagePool.map((url) => (
            <Thumb
              key={`cover-pick-${url}`}
              url={url}
              cacheKey={generationKey}
              selected={sameImageUrl(url, coverUrl)}
              disabled={disabled}
              label={
                sameImageUrl(url, coverUrl)
                  ? "Foto cover saat ini"
                  : "Jadikan cover"
              }
              onClick={() => onSetCover(url)}
            />
          ))}
        </div>
      </div>

      {photoUrls.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Urutan slide foto
          </p>
          <ul className="space-y-2">
            {photoUrls.map((url, ordinal) => (
              <li
                key={`photo-row-${ordinal}-${url}`}
                className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2"
              >
                <Thumb
                  url={url}
                  cacheKey={generationKey}
                  label={`Slide foto ${ordinal + 1}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    Foto {ordinal + 1}
                  </p>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      setReplaceOrdinal((prev) =>
                        prev === ordinal ? null : ordinal
                      )
                    }
                    className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline disabled:opacity-50"
                  >
                    {replaceOrdinal === ordinal ? "Batal ganti" : "Ganti foto"}
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={disabled || ordinal === 0}
                    aria-label={`Naikkan foto ${ordinal + 1}`}
                    onClick={() => onMovePhoto(ordinal, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={disabled || ordinal === photoUrls.length - 1}
                    aria-label={`Turunkan foto ${ordinal + 1}`}
                    onClick={() => onMovePhoto(ordinal, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {replaceOrdinal !== null ? (
            <div className="space-y-1.5 rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-2">
              <p className="text-xs text-zinc-600">
                Pilih foto pengganti untuk Foto {replaceOrdinal + 1}
                {leftover.length === 0 && replaceCandidates.length > 0
                  ? " (akan ditukar dengan cover/slide lain)."
                  : "."}
              </p>
              <div className="flex flex-wrap gap-2">
                {replaceCandidates.map((url) => (
                  <Thumb
                    key={`replace-${replaceOrdinal}-${url}`}
                    url={url}
                    cacheKey={generationKey}
                    disabled={disabled}
                    selected={sameImageUrl(url, coverUrl)}
                    label="Pakai di slide ini"
                    onClick={() => {
                      onSetPhoto(replaceOrdinal, url);
                      setReplaceOrdinal(null);
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {leftover.length > 0 && replaceOrdinal === null ? (
        <p className="text-xs text-zinc-500">
          {leftover.length} foto lain belum dipakai di slide — bisa dipilih
          sebagai cover atau lewat Ganti foto.
        </p>
      ) : null}
    </div>
  );
}
