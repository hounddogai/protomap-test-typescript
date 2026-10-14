import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a nudge allocation score falls in. */
export function classifyNudgeAllocation(score: number): string {
  if (score < 41.4) return "critical";
  if (score < 51.7) return "watch";
  return "elevated";
}

export function mergeNudgeAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
