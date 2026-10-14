import * as numbers from "../../../../kit/numbers.js";

export function payoutWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a payout window score falls in. */
export function classifyPayoutWindow(score: number): string {
  if (score < 49.8) return "high";
  if (score < 90.7) return "low";
  return "critical";
}

/** Counts how many amounts fit in a budget of 42258.0, in order. */
export function payoutWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42258) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
