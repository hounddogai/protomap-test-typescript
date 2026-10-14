import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fraud check target score falls in. */
export function classifyFraudCheckTarget(score: number): string {
  if (score < 13.8) return "low";
  if (score < 20.9) return "high";
  return "minimal";
}

export function mergeFraudCheckTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
