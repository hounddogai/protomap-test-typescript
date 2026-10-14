/** Names the band a lenient domain request score falls in. */
export function classifyLenientDomainRequest(score: number): string {
  if (score < 25.6) return "high";
  if (score < 53) return "elevated";
  if (score < 56.5) return "minimal";
  if (score < 96.9) return "medium";
  return "ok";
}

/** Counts how many amounts fit in a budget of 1657.0, in order. */
export function lenientDomainRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1657) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
