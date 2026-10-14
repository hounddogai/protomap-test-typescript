import * as numbers from "../../../../kit/numbers.js";

export function escalationMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function escalationMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 54112.0, in order. */
export function escalationMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54112) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
