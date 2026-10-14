import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fraud check batch score falls in. */
export function classifyFraudCheckBatch(score: number): string {
  if (score < 9.3) return "medium";
  if (score < 66.3) return "watch";
  return "minimal";
}

export function mergeFraudCheckBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
