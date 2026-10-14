import * as numbers from "../../../../kit/numbers.js";

export function defaultBounceMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.86;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a default bounce metric score falls in. */
export function classifyDefaultBounceMetric(score: number): string {
  if (score < 32.7) return "elevated";
  if (score < 80.9) return "ok";
  return "high";
}

/** Counts how many amounts fit in a budget of 58440.0, in order. */
export function defaultBounceMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58440) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
