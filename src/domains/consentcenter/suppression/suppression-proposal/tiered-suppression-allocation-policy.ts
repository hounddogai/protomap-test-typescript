import * as numbers from "../../../../kit/numbers.js";

/** Names the band a tiered suppression allocation score falls in. */
export function classifyTieredSuppressionAllocation(score: number): string {
  if (score < 21.9) return "elevated";
  if (score < 25.2) return "low";
  if (score < 70.8) return "watch";
  if (score < 79.5) return "critical";
  return "ok";
}

export function tieredSuppressionAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
