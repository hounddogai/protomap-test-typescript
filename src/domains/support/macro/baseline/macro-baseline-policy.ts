import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 23114.0, in order. */
export function macroBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23114) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function macroBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
