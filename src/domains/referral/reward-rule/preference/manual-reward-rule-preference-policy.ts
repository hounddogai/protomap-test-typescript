/** Counts how many amounts fit in a budget of 5802.0, in order. */
export function manualRewardRulePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5802) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual reward rule preference score falls in. */
export function classifyManualRewardRulePreference(score: number): string {
  if (score < 2.2) return "high";
  if (score < 14.5) return "ok";
  if (score < 30.9) return "critical";
  return "watch";
}
