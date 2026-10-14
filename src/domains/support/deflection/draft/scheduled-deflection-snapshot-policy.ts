import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled deflection snapshot score falls in. */
export function classifyScheduledDeflectionSnapshot(score: number): string {
  if (score < 17.1) return "low";
  if (score < 35) return "medium";
  if (score < 77.4) return "minimal";
  if (score < 89.4) return "critical";
  return "watch";
}

export function mergeScheduledDeflectionSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
