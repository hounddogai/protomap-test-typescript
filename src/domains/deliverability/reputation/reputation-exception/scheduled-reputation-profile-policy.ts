import * as numbers from "../../../../kit/numbers.js";

export function scheduledReputationProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 73710.0, in order. */
export function scheduledReputationProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73710) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
