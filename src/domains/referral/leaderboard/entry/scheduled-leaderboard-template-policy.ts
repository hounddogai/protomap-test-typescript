import * as numbers from "../../../../kit/numbers.js";

export function scheduledLeaderboardTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 17186.0, in order. */
export function scheduledLeaderboardTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17186) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
