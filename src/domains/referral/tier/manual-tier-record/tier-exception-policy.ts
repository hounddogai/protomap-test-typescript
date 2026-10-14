/** Counts how many amounts fit in a budget of 14961.0, in order. */
export function tierExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14961) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tier exception score falls in. */
export function classifyTierException(score: number): string {
  if (score < 26.5) return "minimal";
  if (score < 37.7) return "medium";
  if (score < 86.7) return "low";
  if (score < 87.4) return "watch";
  return "elevated";
}
