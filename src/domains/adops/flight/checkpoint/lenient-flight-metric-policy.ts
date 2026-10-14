import * as numbers from "../../../../kit/numbers.js";

export function lenientFlightMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientFlightMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 36809.0, in order. */
export function lenientFlightMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36809) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient flight metric score falls in. */
export function classifyLenientFlightMetric(score: number): string {
  if (score < 35) return "elevated";
  if (score < 91) return "low";
  return "high";
}
