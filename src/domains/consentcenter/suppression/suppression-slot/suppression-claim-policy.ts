import * as numbers from "../../../../kit/numbers.js";

export function suppressionClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 75696.0, in order. */
export function suppressionClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75696) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function suppressionClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
