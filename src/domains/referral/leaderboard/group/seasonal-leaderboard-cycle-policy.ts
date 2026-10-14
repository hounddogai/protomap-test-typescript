import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal leaderboard cycle score falls in. */
export function classifySeasonalLeaderboardCycle(score: number): string {
  if (score < 35.5) return "watch";
  if (score < 70.4) return "ok";
  if (score < 78.2) return "medium";
  return "elevated";
}

export function seasonalLeaderboardCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
