import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 52984.0, in order. */
export function seasonalRedemptionSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52984) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalRedemptionSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
