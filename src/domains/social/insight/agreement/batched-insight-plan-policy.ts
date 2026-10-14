import * as numbers from "../../../../kit/numbers.js";

export function batchedInsightPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 61134.0, in order. */
export function batchedInsightPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61134) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedInsightPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
