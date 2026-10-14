/** Counts how many amounts fit in a budget of 54120.0, in order. */
export function challengeAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54120) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function challengeAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a challenge adjustment score falls in. */
export function classifyChallengeAdjustment(score: number): string {
  if (score < 29.3) return "ok";
  if (score < 54.7) return "watch";
  if (score < 58.6) return "medium";
  return "elevated";
}
