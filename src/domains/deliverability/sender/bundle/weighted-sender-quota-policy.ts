import * as numbers from "../../../../kit/numbers.js";

/** Names the band a weighted sender quota score falls in. */
export function classifyWeightedSenderQuota(score: number): string {
  if (score < 39.8) return "low";
  if (score < 57.3) return "ok";
  if (score < 71.9) return "watch";
  if (score < 88.2) return "medium";
  return "elevated";
}

export function weightedSenderQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
