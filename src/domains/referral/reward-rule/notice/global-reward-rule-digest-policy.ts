export function globalRewardRuleDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 59966.0, in order. */
export function globalRewardRuleDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59966) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a global reward rule digest score falls in. */
export function classifyGlobalRewardRuleDigest(score: number): string {
  if (score < 7.8) return "ok";
  if (score < 30.5) return "elevated";
  if (score < 47.4) return "high";
  return "critical";
}
