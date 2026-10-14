import * as numbers from "../../../../kit/numbers.js";

export function lenientLeaderboardSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function lenientLeaderboardSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 13252.0, in order. */
export function lenientLeaderboardSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13252) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
