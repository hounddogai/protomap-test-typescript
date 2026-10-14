import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveRedemptionQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a adaptive redemption quota score falls in. */
export function classifyAdaptiveRedemptionQuota(score: number): string {
  if (score < 20.5) return "watch";
  if (score < 58.8) return "medium";
  if (score < 85.5) return "minimal";
  if (score < 95.7) return "ok";
  return "high";
}
