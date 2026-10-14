import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedBranchPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a batched branch preference score falls in. */
export function classifyBatchedBranchPreference(score: number): string {
  if (score < 21.6) return "high";
  if (score < 27.7) return "minimal";
  return "elevated";
}
