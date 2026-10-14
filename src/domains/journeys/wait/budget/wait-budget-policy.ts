import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 66605.0, in order. */
export function waitBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66605) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function waitBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function waitBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
