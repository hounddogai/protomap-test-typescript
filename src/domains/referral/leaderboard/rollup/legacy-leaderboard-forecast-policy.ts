/** Counts how many amounts fit in a budget of 38782.0, in order. */
export function legacyLeaderboardForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38782) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a legacy leaderboard forecast score falls in. */
export function classifyLegacyLeaderboardForecast(score: number): string {
  if (score < 1.7) return "watch";
  if (score < 17.8) return "elevated";
  if (score < 30.9) return "low";
  if (score < 94.3) return "critical";
  return "minimal";
}
