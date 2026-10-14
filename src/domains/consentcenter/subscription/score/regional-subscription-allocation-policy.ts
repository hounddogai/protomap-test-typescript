import * as numbers from "../../../../kit/numbers.js";

export function regionalSubscriptionAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a regional subscription allocation score falls in. */
export function classifyRegionalSubscriptionAllocation(score: number): string {
  if (score < 47.1) return "minimal";
  if (score < 61.3) return "critical";
  if (score < 93.8) return "elevated";
  return "high";
}
