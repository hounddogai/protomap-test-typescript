import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 90301.0, in order. */
export function rollingStepPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90301) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingStepPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function rollingStepPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
