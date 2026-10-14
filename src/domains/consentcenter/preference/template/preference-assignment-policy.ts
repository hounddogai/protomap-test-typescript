import * as numbers from "../../../../kit/numbers.js";

export function preferenceAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 85381.0, in order. */
export function preferenceAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85381) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function preferenceAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
