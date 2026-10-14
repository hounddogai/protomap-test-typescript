import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 48882.0, in order. */
export function postReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48882) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function postReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
