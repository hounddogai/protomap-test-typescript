import * as numbers from "../../../../kit/numbers.js";

export function enrollmentBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.66;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a enrollment budget score falls in. */
export function classifyEnrollmentBudget(score: number): string {
  if (score < 9.3) return "watch";
  if (score < 40.4) return "high";
  if (score < 42.6) return "elevated";
  if (score < 92.3) return "ok";
  return "low";
}
