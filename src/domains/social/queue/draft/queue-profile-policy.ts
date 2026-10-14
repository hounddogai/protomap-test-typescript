import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 99575.0, in order. */
export function queueProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99575) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function queueProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
