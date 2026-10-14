import * as numbers from "../../../../kit/numbers.js";

export function seasonalSubscriptionMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 24673.0, in order. */
export function seasonalSubscriptionMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24673) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalSubscriptionMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
