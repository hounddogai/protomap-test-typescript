import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched placement batch score falls in. */
export function classifyBatchedPlacementBatch(score: number): string {
  if (score < 7.8) return "medium";
  if (score < 26.6) return "minimal";
  return "elevated";
}

export function mergeBatchedPlacementBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
