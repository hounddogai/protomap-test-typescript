import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 96975.0, in order. */
export function legacyDoubleOptInForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96975) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacyDoubleOptInForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
