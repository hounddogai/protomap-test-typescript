import * as numbers from "../../../../kit/numbers.js";

/** Names the band a weighted queue estimate score falls in. */
export function classifyWeightedQueueEstimate(score: number): string {
  if (score < 30.2) return "watch";
  if (score < 77.4) return "medium";
  if (score < 94.1) return "critical";
  return "ok";
}

export function weightedQueueEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
