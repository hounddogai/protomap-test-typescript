import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 90830.0, in order. */
export function rollingWaitWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90830) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingWaitWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function rollingWaitWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
