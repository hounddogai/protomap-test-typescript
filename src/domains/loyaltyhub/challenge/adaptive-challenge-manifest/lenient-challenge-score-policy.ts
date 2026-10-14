import * as numbers from "../../../../kit/numbers.js";

export function lenientChallengeScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 16113.0, in order. */
export function lenientChallengeScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16113) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient challenge score score falls in. */
export function classifyLenientChallengeScore(score: number): string {
  if (score < 59.2) return "low";
  if (score < 70.9) return "minimal";
  if (score < 98.2) return "critical";
  return "watch";
}
