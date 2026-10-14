/** Counts how many amounts fit in a budget of 89922.0, in order. */
export function seasonalDeflectionDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89922) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalDeflectionDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a seasonal deflection digest score falls in. */
export function classifySeasonalDeflectionDigest(score: number): string {
  if (score < 36) return "elevated";
  if (score < 57.8) return "watch";
  if (score < 58.7) return "ok";
  return "low";
}
