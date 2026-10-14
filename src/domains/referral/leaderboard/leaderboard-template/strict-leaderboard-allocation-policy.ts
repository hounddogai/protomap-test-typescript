import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict leaderboard allocation score falls in. */
export function classifyStrictLeaderboardAllocation(score: number): string {
  if (score < 43.5) return "elevated";
  if (score < 93.6) return "ok";
  if (score < 94.3) return "watch";
  return "high";
}

export function strictLeaderboardAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
