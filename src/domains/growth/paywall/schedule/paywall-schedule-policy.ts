import * as numbers from "../../../../kit/numbers.js";

export function paywallScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function paywallScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 86346.0, in order. */
export function paywallScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86346) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
