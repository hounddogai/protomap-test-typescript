import * as numbers from "../../../../kit/numbers.js";

export function rollingCsatCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 19176.0, in order. */
export function rollingCsatCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19176) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
