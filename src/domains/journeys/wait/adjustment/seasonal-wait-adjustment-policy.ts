import * as numbers from "../../../../kit/numbers.js";

export function seasonalWaitAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a seasonal wait adjustment score falls in. */
export function classifySeasonalWaitAdjustment(score: number): string {
  if (score < 1.8) return "medium";
  if (score < 4.5) return "ok";
  if (score < 33.5) return "watch";
  return "low";
}
