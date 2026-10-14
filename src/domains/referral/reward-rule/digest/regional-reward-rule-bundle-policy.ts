import * as numbers from "../../../../kit/numbers.js";

/** Names the band a regional reward rule bundle score falls in. */
export function classifyRegionalRewardRuleBundle(score: number): string {
  if (score < 3.8) return "elevated";
  if (score < 12.6) return "minimal";
  if (score < 75.1) return "medium";
  if (score < 93.3) return "ok";
  return "critical";
}

export function regionalRewardRuleBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
