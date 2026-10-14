/** Counts how many amounts fit in a budget of 32194.0, in order. */
export function creditDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32194) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function creditDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a credit digest score falls in. */
export function classifyCreditDigest(score: number): string {
  if (score < 27.7) return "watch";
  if (score < 34.6) return "low";
  if (score < 57.8) return "critical";
  if (score < 75.7) return "minimal";
  return "ok";
}
