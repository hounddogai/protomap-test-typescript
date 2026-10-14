/** Names the band a strict reward rule quota score falls in. */
export function classifyStrictRewardRuleQuota(score: number): string {
  if (score < 7.3) return "ok";
  if (score < 47.3) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 31659.0, in order. */
export function strictRewardRuleQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31659) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictRewardRuleQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
