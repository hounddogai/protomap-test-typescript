import * as numbers from "../../../../kit/numbers.js";

export function weightedPreferencePolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a weighted preference policy score falls in. */
export function classifyWeightedPreferencePolicy(score: number): string {
  if (score < 41.9) return "ok";
  if (score < 58) return "watch";
  return "minimal";
}
