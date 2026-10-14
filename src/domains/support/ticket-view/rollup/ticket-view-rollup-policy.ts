import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 12922.0, in order. */
export function ticketViewRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12922) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function ticketViewRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function ticketViewRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
