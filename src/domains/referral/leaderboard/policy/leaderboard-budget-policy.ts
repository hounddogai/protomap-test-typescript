export function leaderboardBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 2271.0, in order. */
export function leaderboardBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2271) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a leaderboard budget score falls in. */
export function classifyLeaderboardBudget(score: number): string {
  if (score < 34.8) return "elevated";
  if (score < 67.2) return "minimal";
  if (score < 97.3) return "ok";
  return "critical";
}

/** Puts a leaderboard budget code in its canonical LB- form. */
export function normalizeLeaderboardBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LB-")) return clean;
  return `LB-${clean.replaceAll(" ", "-")}`;
}
