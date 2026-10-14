import * as numbers from "../../../../kit/numbers.js";

export function cappedFrequencyBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 98316.0, in order. */
export function cappedFrequencyBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98316) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
