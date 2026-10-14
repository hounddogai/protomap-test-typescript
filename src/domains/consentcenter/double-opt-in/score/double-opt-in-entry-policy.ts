import * as numbers from "../../../../kit/numbers.js";

export function doubleOptInEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 84534.0, in order. */
export function doubleOptInEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84534) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
