import * as numbers from "../../../../kit/numbers.js";

export function rollingQueueAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling queue adjustment score falls in. */
export function classifyRollingQueueAdjustment(score: number): string {
  if (score < 28.3) return "elevated";
  if (score < 61.9) return "low";
  if (score < 86.3) return "high";
  if (score < 86.7) return "critical";
  return "ok";
}
