/** Names the band a seasonal sender milestone score falls in. */
export function classifySeasonalSenderMilestone(score: number): string {
  if (score < 12.9) return "minimal";
  if (score < 28.5) return "low";
  if (score < 71.3) return "watch";
  if (score < 91.5) return "elevated";
  return "high";
}

/** Counts how many amounts fit in a budget of 81946.0, in order. */
export function seasonalSenderMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81946) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
