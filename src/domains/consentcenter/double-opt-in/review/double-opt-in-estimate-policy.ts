/** Names the band a double opt in estimate score falls in. */
export function classifyDoubleOptInEstimate(score: number): string {
  if (score < 39.8) return "elevated";
  if (score < 62.3) return "minimal";
  if (score < 67.4) return "critical";
  return "medium";
}

/** Counts how many amounts fit in a budget of 98527.0, in order. */
export function doubleOptInEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98527) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
