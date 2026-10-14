import * as numbers from "../../../../kit/numbers.js";

export function pathReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 34341.0, in order. */
export function pathReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34341) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pathReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a path review score falls in. */
export function classifyPathReview(score: number): string {
  if (score < 12.3) return "elevated";
  if (score < 24.1) return "low";
  return "high";
}
