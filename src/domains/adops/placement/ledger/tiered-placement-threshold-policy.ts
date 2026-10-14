import * as numbers from "../../../../kit/numbers.js";

export function tieredPlacementThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a tiered placement threshold score falls in. */
export function classifyTieredPlacementThreshold(score: number): string {
  if (score < 70) return "low";
  if (score < 94.9) return "ok";
  return "watch";
}
