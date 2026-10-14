import * as numbers from "../../../../kit/numbers.js";

export function warmupMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 67742.0, in order. */
export function warmupMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67742) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
