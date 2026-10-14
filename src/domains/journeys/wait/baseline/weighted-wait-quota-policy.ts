import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function weightedWaitQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a weighted wait quota score falls in. */
export function classifyWeightedWaitQuota(score: number): string {
  if (score < 12.7) return "low";
  if (score < 90.9) return "medium";
  return "minimal";
}

export function mergeWeightedWaitQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
