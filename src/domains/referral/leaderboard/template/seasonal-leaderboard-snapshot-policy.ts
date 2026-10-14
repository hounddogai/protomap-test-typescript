import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 39048.0, in order. */
export function seasonalLeaderboardSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39048) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalLeaderboardSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function seasonalLeaderboardSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a seasonal leaderboard snapshot score falls in. */
export function classifySeasonalLeaderboardSnapshot(score: number): string {
  if (score < 25.5) return "high";
  if (score < 98.1) return "low";
  return "critical";
}
