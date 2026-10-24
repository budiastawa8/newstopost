import type { SummarizeResult } from "@/lib/types";

export function formatCaptionForPost(
  result: Pick<SummarizeResult, "caption" | "hashtags">,
  sourceUrl?: string | null
): string {
  const tags = result.hashtags.join(" ");
  const base = `${result.caption.trim()}\n\n${tags}`.trim();
  if (sourceUrl) {
    return `${base}\n\nSumber: ${sourceUrl}`;
  }
  return base;
}
