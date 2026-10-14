/** Counts how many amounts fit in a budget of 4085.0, in order. */
export function leaderboardPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4085) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a leaderboard policy score falls in. */
export function classifyLeaderboardPolicy(score: number): string {
  if (score < 66.5) return "medium";
  if (score < 75) return "elevated";
  return "minimal";
}
