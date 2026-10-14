/** Counts how many amounts fit in a budget of 44522.0, in order. */
export function suppressionWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44522) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a suppression window score falls in. */
export function classifySuppressionWindow(score: number): string {
  if (score < 12.6) return "ok";
  if (score < 26) return "elevated";
  if (score < 32.2) return "low";
  return "minimal";
}
