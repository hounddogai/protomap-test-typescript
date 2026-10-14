import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 71212.0, in order. */
export function batchedCreditEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71212) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedCreditEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function batchedCreditEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
