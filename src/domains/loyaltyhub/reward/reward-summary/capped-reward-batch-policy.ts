import * as numbers from "../../../../kit/numbers.js";

export function cappedRewardBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 88770.0, in order. */
export function cappedRewardBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88770) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped reward batch score falls in. */
export function classifyCappedRewardBatch(score: number): string {
  if (score < 2.9) return "critical";
  if (score < 14.4) return "minimal";
  if (score < 16.6) return "low";
  if (score < 39.5) return "watch";
  return "high";
}
