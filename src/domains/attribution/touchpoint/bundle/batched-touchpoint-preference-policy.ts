import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedTouchpointPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a batched touchpoint preference score falls in. */
export function classifyBatchedTouchpointPreference(score: number): string {
  if (score < 10.4) return "low";
  if (score < 20.5) return "critical";
  if (score < 40.8) return "watch";
  if (score < 46.2) return "medium";
  return "high";
}
