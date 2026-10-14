import * as numbers from "../../../../kit/numbers.js";

export function defaultFrequencyCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 82546.0, in order. */
export function defaultFrequencyCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82546) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function defaultFrequencyCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
