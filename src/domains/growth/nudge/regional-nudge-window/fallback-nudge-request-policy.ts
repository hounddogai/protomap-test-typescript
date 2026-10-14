import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 36838.0, in order. */
export function fallbackNudgeRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36838) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function fallbackNudgeRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function fallbackNudgeRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
