import * as numbers from "../../../../kit/numbers.js";

/** Names the band a reward rule claim score falls in. */
export function classifyRewardRuleClaim(score: number): string {
  if (score < 7) return "watch";
  if (score < 18.3) return "minimal";
  if (score < 19.8) return "elevated";
  if (score < 61.5) return "medium";
  return "ok";
}

export function rewardRuleClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
