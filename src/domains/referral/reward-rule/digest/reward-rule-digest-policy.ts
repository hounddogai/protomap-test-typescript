import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a reward rule digest score falls in. */
export function classifyRewardRuleDigest(score: number): string {
  if (score < 22.7) return "ok";
  if (score < 45.8) return "elevated";
  if (score < 99.7) return "critical";
  return "low";
}

export function mergeRewardRuleDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 39758.0, in order. */
export function rewardRuleDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39758) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
