import * as numbers from "../../../../kit/numbers.js";

export function slaMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 925.0, in order. */
export function slaMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 925) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
