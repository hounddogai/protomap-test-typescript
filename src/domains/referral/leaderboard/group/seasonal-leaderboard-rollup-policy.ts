import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal leaderboard rollup score falls in. */
export function classifySeasonalLeaderboardRollup(score: number): string {
  if (score < 39.6) return "minimal";
  if (score < 85.4) return "high";
  return "elevated";
}

export function seasonalLeaderboardRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
