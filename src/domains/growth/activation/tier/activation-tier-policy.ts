import * as numbers from "../../../../kit/numbers.js";

/** Names the band a activation tier score falls in. */
export function classifyActivationTier(score: number): string {
  if (score < 60.1) return "high";
  if (score < 65.7) return "watch";
  if (score < 82.8) return "critical";
  return "low";
}

/** Counts how many amounts fit in a budget of 59917.0, in order. */
export function activationTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59917) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function activationTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
