/** Counts how many amounts fit in a budget of 39991.0, in order. */
export function scheduledLeaderboardOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39991) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a scheduled leaderboard override code in its canonical SLO- form. */
export function normalizeScheduledLeaderboardOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLO-")) return clean;
  return `SLO-${clean.replaceAll(" ", "-")}`;
}
