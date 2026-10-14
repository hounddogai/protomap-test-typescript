import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function redemptionPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function mergeRedemptionPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a redemption policy score falls in. */
export function classifyRedemptionPolicy(score: number): string {
  if (score < 42) return "high";
  if (score < 89.9) return "elevated";
  return "watch";
}
