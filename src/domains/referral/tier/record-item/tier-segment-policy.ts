/** Names the band a tier segment score falls in. */
export function classifyTierSegment(score: number): string {
  if (score < 1.4) return "elevated";
  if (score < 8.3) return "watch";
  if (score < 30) return "low";
  if (score < 53.3) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 67473.0, in order. */
export function tierSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67473) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
