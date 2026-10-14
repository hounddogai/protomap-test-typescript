import * as numbers from "../../../../kit/numbers.js";

export function preferenceAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 82378.0, in order. */
export function preferenceAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82378) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
