import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 5438.0, in order. */
export function bounceBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5438) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function bounceBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
