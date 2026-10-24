"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCaptionForPost } from "@/lib/caption";
import type { SummarizeResult } from "@/lib/types";

export interface CaptionPanelProps {
  summarize: SummarizeResult | null;
  sourceUrl?: string | null;
}

export function CaptionPanel({ summarize, sourceUrl }: CaptionPanelProps) {
  const [copied, setCopied] = useState(false);

  const fullText = useMemo(() => {
    if (!summarize) return "";
    return formatCaptionForPost(summarize, sourceUrl);
  }, [summarize, sourceUrl]);

  if (!summarize) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Caption siap posting</CardTitle>
        <CardDescription>
          Untuk Instagram / Facebook — salin lalu tempel di caption post.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800">
          {fullText}
        </div>

        <div className="flex flex-wrap gap-2">
          {summarize.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-100"
            >
              {tag}
            </span>
          ))}
        </div>

        <Button type="button" variant="secondary" onClick={handleCopy}>
          {copied ? "Tersalin!" : "Salin caption + hashtag"}
        </Button>
      </CardContent>
    </Card>
  );
}
