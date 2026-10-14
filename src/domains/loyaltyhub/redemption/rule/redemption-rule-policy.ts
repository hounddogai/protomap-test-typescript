import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function redemptionRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a redemption rule score falls in. */
export function classifyRedemptionRule(score: number): string {
  if (score < 18) return "critical";
  if (score < 29.9) return "watch";
  if (score < 61.8) return "high";
  return "minimal";
}

export function mergeRedemptionRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
