import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyStreakThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy streak threshold score falls in. */
export function classifyLegacyStreakThreshold(score: number): string {
  if (score < 5.6) return "elevated";
  if (score < 33.6) return "medium";
  if (score < 86.5) return "minimal";
  if (score < 91) return "high";
  return "critical";
}
