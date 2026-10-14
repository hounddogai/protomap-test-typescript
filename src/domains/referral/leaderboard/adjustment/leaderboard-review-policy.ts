import * as numbers from "../../../../kit/numbers.js";

/** Names the band a leaderboard review score falls in. */
export function classifyLeaderboardReview(score: number): string {
  if (score < 12.4) return "critical";
  if (score < 50.3) return "low";
  if (score < 63.3) return "minimal";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 93015.0, in order. */
export function leaderboardReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93015) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function leaderboardReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
