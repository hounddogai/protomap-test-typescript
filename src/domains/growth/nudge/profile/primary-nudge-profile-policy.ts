import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryNudgeProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary nudge profile score falls in. */
export function classifyPrimaryNudgeProfile(score: number): string {
  if (score < 75) return "elevated";
  if (score < 83.3) return "critical";
  return "low";
}
