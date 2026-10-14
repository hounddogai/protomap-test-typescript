/** Names the band a bid rule item score falls in. */
export function classifyBidRuleItem(score: number): string {
  if (score < 32.4) return "ok";
  if (score < 36.8) return "elevated";
  return "high";
}

/** Counts how many amounts fit in a budget of 79560.0, in order. */
export function bidRuleItemBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79560) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
