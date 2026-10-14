import * as numbers from "../../../../kit/numbers.js";

export function rewardRuleBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a reward rule bundle score falls in. */
export function classifyRewardRuleBundle(score: number): string {
  if (score < 5.8) return "elevated";
  if (score < 33.7) return "medium";
  if (score < 42.2) return "watch";
  if (score < 95.1) return "high";
  return "critical";
}
