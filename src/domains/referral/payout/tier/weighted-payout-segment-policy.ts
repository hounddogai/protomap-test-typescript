import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted payout segment score falls in. */
export function classifyWeightedPayoutSegment(score: number): string {
  if (score < 28.3) return "minimal";
  if (score < 51.4) return "medium";
  return "elevated";
}

export function mergeWeightedPayoutSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedPayoutSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
