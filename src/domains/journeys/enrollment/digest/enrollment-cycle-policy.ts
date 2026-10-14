import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeEnrollmentCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a enrollment cycle score falls in. */
export function classifyEnrollmentCycle(score: number): string {
  if (score < 14.6) return "low";
  if (score < 36.1) return "elevated";
  if (score < 45) return "critical";
  return "minimal";
}
