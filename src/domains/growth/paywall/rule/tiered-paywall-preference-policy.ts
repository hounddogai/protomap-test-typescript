import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 37289.0, in order. */
export function tieredPaywallPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37289) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredPaywallPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
