import * as numbers from "../../../../kit/numbers.js";

export function strictSenderSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 12048.0, in order. */
export function strictSenderSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12048) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictSenderSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
