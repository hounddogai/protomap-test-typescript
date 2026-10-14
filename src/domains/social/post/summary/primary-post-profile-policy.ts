/** Counts how many amounts fit in a budget of 95256.0, in order. */
export function primaryPostProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95256) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary post profile score falls in. */
export function classifyPrimaryPostProfile(score: number): string {
  if (score < 9.8) return "low";
  if (score < 42.9) return "minimal";
  if (score < 86.7) return "watch";
  return "high";
}
