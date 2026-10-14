import * as numbers from "../../../../kit/numbers.js";

export function globalBranchDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a global branch digest score falls in. */
export function classifyGlobalBranchDigest(score: number): string {
  if (score < 90) return "low";
  if (score < 94.2) return "high";
  return "critical";
}

export function globalBranchDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
