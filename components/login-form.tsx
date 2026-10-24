"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ setupMissing }: { setupMissing?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const next = searchParams.get("next") || "/";
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/logo.png"
          alt="NewsToPost"
          width={96}
          height={96}
          priority
          className="h-24 w-24 rounded-2xl shadow-md ring-1 ring-black/10"
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            NewsToPost
          </h1>
          <p className="text-sm text-zinc-600">
            Akses terbatas untuk tim konten. Masukkan password bersama.
          </p>
        </div>
      </div>

      {setupMissing ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Belum dikonfigurasi</p>
          <p className="mt-1 text-amber-900/90">
            Set <code className="rounded bg-amber-100 px-1">APP_PASSWORD</code> di
            Vercel Environment Variables, lalu Redeploy.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password tim</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Memeriksa…" : "Masuk"}
          </Button>
        </form>
      )}
    </div>
  );
}
