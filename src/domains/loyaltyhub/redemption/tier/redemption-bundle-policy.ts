import * as numbers from "../../../../kit/numbers.js";

export function redemptionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a redemption bundle score falls in. */
export function classifyRedemptionBundle(score: number): string {
  if (score < 2.2) return "elevated";
  if (score < 37.8) return "low";
  if (score < 83.6) return "watch";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 67479.0, in order. */
export function redemptionBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67479) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
