import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 36669.0, in order. */
export function batchedCreditMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36669) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedCreditMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched credit metric score falls in. */
export function classifyBatchedCreditMetric(score: number): string {
  if (score < 6.5) return "watch";
  if (score < 17.6) return "elevated";
  if (score < 91.1) return "medium";
  return "critical";
}
