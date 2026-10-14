import * as numbers from "../../../../kit/numbers.js";

export function leaderboardRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 20050.0, in order. */
export function leaderboardRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20050) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
