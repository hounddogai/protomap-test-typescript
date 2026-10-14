import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 76481.0, in order. */
export function queueAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76481) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function queueAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function queueAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
