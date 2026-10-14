import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBidRuleScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a bid rule score score falls in. */
export function classifyBidRuleScore(score: number): string {
  if (score < 26.1) return "elevated";
  if (score < 32) return "minimal";
  if (score < 72.5) return "ok";
  return "low";
}
