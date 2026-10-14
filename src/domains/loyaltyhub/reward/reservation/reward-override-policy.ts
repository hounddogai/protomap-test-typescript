import * as numbers from "../../../../kit/numbers.js";

export function rewardOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 18330.0, in order. */
export function rewardOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18330) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
