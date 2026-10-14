import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a regional reward rule exception score falls in. */
export function classifyRegionalRewardRuleException(score: number): string {
  if (score < 30.2) return "high";
  if (score < 61.7) return "elevated";
  if (score < 64.2) return "critical";
  if (score < 91) return "minimal";
  return "ok";
}

export function mergeRegionalRewardRuleExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
