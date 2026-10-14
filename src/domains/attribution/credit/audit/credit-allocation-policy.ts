import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCreditAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function creditAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a credit allocation score falls in. */
export function classifyCreditAllocation(score: number): string {
  if (score < 39.6) return "critical";
  if (score < 77.3) return "watch";
  return "elevated";
}
