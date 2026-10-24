"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FreeDesignClient } from "@/components/free-design-client";
import { HomeClient } from "@/components/home-client";
import { LogoutButton } from "@/components/logout-button";
import {
  loadStoredAppMode,
  saveStoredAppMode,
  type AppMode,
} from "@/lib/app-mode";
import { cn } from "@/lib/utils";

const MODES: { id: AppMode; label: string; blurb: string }[] = [
  {
    id: "carousel",
    label: "News → Carousel",
    blurb: "Tempel URL, generate ringkasan, unduh PNG siap unggah.",
  },
  {
    id: "studio",
    label: "Desain bebas",
    blurb: "Unggah foto, ketik teks, pilih desain premium, unduh PNG.",
  },
];

export function AppShell({ showLogout = false }: { showLogout?: boolean }) {
  const [mode, setMode] = useState<AppMode>("carousel");

  useEffect(() => {
    setMode(loadStoredAppMode());
  }, []);

  function handleModeChange(next: AppMode) {
    setMode(next);
    saveStoredAppMode(next);
  }

  const active = MODES.find((m) => m.id === mode) ?? MODES[0]!;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-black/10 sm:h-10 sm:w-10 sm:rounded-xl"
            />
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 sm:text-sm sm:tracking-[0.18em]">
              NewsToPost
            </p>
          </div>
          {showLogout ? <LogoutButton /> : null}
        </div>

        <div className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-1">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleModeChange(item.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mode === item.id
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            {mode === "carousel"
              ? "Berita jadi carousel Instagram"
              : "Desain bebas bergaya premium"}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-[15px]">
            {active.blurb}
          </p>
        </div>
      </header>

      {mode === "carousel" ? (
        <HomeClient embedded showLogout={false} />
      ) : (
        <FreeDesignClient />
      )}
    </div>
  );
}
