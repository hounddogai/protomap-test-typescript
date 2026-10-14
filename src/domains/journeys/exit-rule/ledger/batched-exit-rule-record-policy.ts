import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedExitRuleRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a batched exit rule record score falls in. */
export function classifyBatchedExitRuleRecord(score: number): string {
  if (score < 6.2) return "watch";
  if (score < 35.3) return "minimal";
  if (score < 38.1) return "ok";
  if (score < 98.9) return "elevated";
  return "critical";
}
