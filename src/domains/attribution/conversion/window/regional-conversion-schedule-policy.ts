import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 66225.0, in order. */
export function regionalConversionScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66225) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function regionalConversionScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional conversion schedule score falls in. */
export function classifyRegionalConversionSchedule(score: number): string {
  if (score < 23.4) return "critical";
  if (score < 24.5) return "watch";
  if (score < 95.3) return "low";
  return "elevated";
}
