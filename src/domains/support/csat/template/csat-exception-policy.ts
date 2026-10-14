import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 65392.0, in order. */
export function csatExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65392) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function csatExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function csatExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
