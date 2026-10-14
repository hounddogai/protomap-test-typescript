import * as numbers from "../../../../kit/numbers.js";

export function cappedOptOutLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function cappedOptOutLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 72048.0, in order. */
export function cappedOptOutLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72048) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
