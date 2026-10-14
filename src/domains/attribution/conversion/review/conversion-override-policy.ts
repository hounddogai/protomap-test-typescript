import * as numbers from "../../../../kit/numbers.js";

export function conversionOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 65502.0, in order. */
export function conversionOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65502) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function conversionOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
