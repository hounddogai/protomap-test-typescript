import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultChallengeThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default challenge threshold score falls in. */
export function classifyDefaultChallengeThreshold(score: number): string {
  if (score < 5.9) return "medium";
  if (score < 15.4) return "low";
  if (score < 75.6) return "watch";
  if (score < 78.5) return "minimal";
  return "critical";
}
