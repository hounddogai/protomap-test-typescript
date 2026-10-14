import * as numbers from "../../../../kit/numbers.js";

export function batchedChallengeReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 3207.0, in order. */
export function batchedChallengeReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3207) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched challenge review score falls in. */
export function classifyBatchedChallengeReview(score: number): string {
  if (score < 15.7) return "high";
  if (score < 50.2) return "ok";
  if (score < 60.1) return "elevated";
  if (score < 91.3) return "watch";
  return "medium";
}

export function batchedChallengeReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
