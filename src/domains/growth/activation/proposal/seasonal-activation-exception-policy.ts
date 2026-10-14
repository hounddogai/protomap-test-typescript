import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 25536.0, in order. */
export function seasonalActivationExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25536) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalActivationExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
