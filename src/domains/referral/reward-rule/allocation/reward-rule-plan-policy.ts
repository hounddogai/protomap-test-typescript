import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a reward rule plan score falls in. */
export function classifyRewardRulePlan(score: number): string {
  if (score < 9.4) return "minimal";
  if (score < 19.8) return "medium";
  return "low";
}

export function mergeRewardRulePlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function rewardRulePlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
