import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 40038.0, in order. */
export function adaptiveLeaderboardMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40038) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveLeaderboardMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a adaptive leaderboard metric score falls in. */
export function classifyAdaptiveLeaderboardMetric(score: number): string {
  if (score < 5.7) return "medium";
  if (score < 82.3) return "ok";
  if (score < 99.6) return "critical";
  return "minimal";
}

export function adaptiveLeaderboardMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
