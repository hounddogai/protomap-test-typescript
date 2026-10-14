/** Counts how many amounts fit in a budget of 40500.0, in order. */
export function leaderboardSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40500) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a leaderboard summary score falls in. */
export function classifyLeaderboardSummary(score: number): string {
  if (score < 4.9) return "ok";
  if (score < 28.1) return "elevated";
  if (score < 86.4) return "low";
  return "minimal";
}
