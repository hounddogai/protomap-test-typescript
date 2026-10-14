import * as numbers from "../../../../kit/numbers.js";

/** Names the band a cohort threshold score falls in. */
export function classifyCohortThreshold(score: number): string {
  if (score < 20.4) return "high";
  if (score < 27.7) return "low";
  if (score < 60.1) return "ok";
  if (score < 92.5) return "medium";
  return "watch";
}

export function cohortThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
