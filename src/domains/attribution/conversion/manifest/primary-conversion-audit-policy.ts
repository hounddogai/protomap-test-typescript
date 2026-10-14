import * as numbers from "../../../../kit/numbers.js";

export function primaryConversionAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function primaryConversionAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 76219.0, in order. */
export function primaryConversionAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76219) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
