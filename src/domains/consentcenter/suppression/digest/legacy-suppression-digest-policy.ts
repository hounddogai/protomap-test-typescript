/** Names the band a legacy suppression digest score falls in. */
export function classifyLegacySuppressionDigest(score: number): string {
  if (score < 68.7) return "elevated";
  if (score < 89.6) return "ok";
  if (score < 99.9) return "minimal";
  return "critical";
}

/** Counts how many amounts fit in a budget of 84332.0, in order. */
export function legacySuppressionDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84332) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
