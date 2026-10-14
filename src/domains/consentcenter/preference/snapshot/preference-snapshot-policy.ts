import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePreferenceSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a preference snapshot score falls in. */
export function classifyPreferenceSnapshot(score: number): string {
  if (score < 40.6) return "high";
  if (score < 41.2) return "low";
  if (score < 98.3) return "watch";
  if (score < 99.7) return "elevated";
  return "minimal";
}
