import * as numbers from "../../../../kit/numbers.js";

/** Names the band a streak budget score falls in. */
export function classifyStreakBudget(score: number): string {
  if (score < 37.6) return "minimal";
  if (score < 56) return "critical";
  if (score < 96.9) return "ok";
  if (score < 98.4) return "watch";
  return "high";
}

/** Counts how many amounts fit in a budget of 24905.0, in order. */
export function streakBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24905) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function streakBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function streakBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
