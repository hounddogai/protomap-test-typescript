import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a lenient reputation review score falls in. */
export function classifyLenientReputationReview(score: number): string {
  if (score < 13.8) return "minimal";
  if (score < 28.5) return "medium";
  if (score < 65.6) return "critical";
  if (score < 89.7) return "low";
  return "watch";
}

export function mergeLenientReputationReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
