/** Counts how many amounts fit in a budget of 60688.0, in order. */
export function touchpointVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60688) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a touchpoint variance score falls in. */
export function classifyTouchpointVariance(score: number): string {
  if (score < 15.6) return "watch";
  if (score < 31.2) return "high";
  if (score < 69.9) return "ok";
  if (score < 75.6) return "minimal";
  return "elevated";
}
