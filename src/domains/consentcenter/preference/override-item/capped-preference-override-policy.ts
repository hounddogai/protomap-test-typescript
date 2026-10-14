/** Names the band a capped preference override score falls in. */
export function classifyCappedPreferenceOverride(score: number): string {
  if (score < 24.2) return "low";
  if (score < 60.5) return "elevated";
  if (score < 64.3) return "watch";
  if (score < 93.1) return "minimal";
  return "critical";
}

/** Counts how many amounts fit in a budget of 20449.0, in order. */
export function cappedPreferenceOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20449) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
