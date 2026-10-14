/** Names the band a fallback leaderboard budget score falls in. */
export function classifyFallbackLeaderboardBudget(score: number): string {
  if (score < 11.6) return "watch";
  if (score < 13.2) return "elevated";
  if (score < 81.1) return "low";
  if (score < 81.9) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 98050.0, in order. */
export function fallbackLeaderboardBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98050) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
