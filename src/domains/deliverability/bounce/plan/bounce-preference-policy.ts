/** Counts how many amounts fit in a budget of 33266.0, in order. */
export function bouncePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33266) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a bounce preference score falls in. */
export function classifyBouncePreference(score: number): string {
  if (score < 16.2) return "medium";
  if (score < 43.4) return "critical";
  if (score < 66.1) return "elevated";
  if (score < 78.4) return "minimal";
  return "low";
}
