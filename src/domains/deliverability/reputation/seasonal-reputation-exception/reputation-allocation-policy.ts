import * as numbers from "../../../../kit/numbers.js";

export function reputationAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a reputation allocation score falls in. */
export function classifyReputationAllocation(score: number): string {
  if (score < 45.6) return "low";
  if (score < 82.1) return "ok";
  return "high";
}

export function reputationAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
