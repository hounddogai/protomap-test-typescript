/** Names the band a bounce rollup score falls in. */
export function classifyBounceRollup(score: number): string {
  if (score < 14.5) return "elevated";
  if (score < 85.4) return "watch";
  if (score < 89.3) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 25046.0, in order. */
export function bounceRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25046) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
