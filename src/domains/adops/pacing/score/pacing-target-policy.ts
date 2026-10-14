import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 50617.0, in order. */
export function pacingTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50617) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pacingTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
