import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a retention tier score falls in. */
export function classifyRetentionTier(score: number): string {
  if (score < 23.7) return "watch";
  if (score < 53.1) return "high";
  if (score < 90.1) return "ok";
  if (score < 90.8) return "elevated";
  return "medium";
}

export function mergeRetentionTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function retentionTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
