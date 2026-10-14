import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 9306.0, in order. */
export function placementReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9306) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function placementReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
