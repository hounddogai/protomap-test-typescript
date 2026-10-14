import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched exit rule mapping score falls in. */
export function classifyBatchedExitRuleMapping(score: number): string {
  if (score < 9.8) return "high";
  if (score < 61.9) return "medium";
  if (score < 93.6) return "minimal";
  return "low";
}

export function mergeBatchedExitRuleMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
