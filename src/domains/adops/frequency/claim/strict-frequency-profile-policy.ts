import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict frequency profile score falls in. */
export function classifyStrictFrequencyProfile(score: number): string {
  if (score < 66) return "watch";
  if (score < 79.5) return "low";
  return "medium";
}

export function strictFrequencyProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 17489.0, in order. */
export function strictFrequencyProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17489) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
