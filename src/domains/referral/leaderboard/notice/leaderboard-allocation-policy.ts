import * as numbers from "../../../../kit/numbers.js";

export function leaderboardAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a leaderboard allocation score falls in. */
export function classifyLeaderboardAllocation(score: number): string {
  if (score < 4) return "medium";
  if (score < 9.8) return "ok";
  if (score < 40.9) return "high";
  return "elevated";
}
