export function reputationQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 699.0, in order. */
export function reputationQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 699) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a reputation quota score falls in. */
export function classifyReputationQuota(score: number): string {
  if (score < 11.8) return "watch";
  if (score < 40.3) return "critical";
  if (score < 97.3) return "elevated";
  if (score < 98.1) return "low";
  return "ok";
}
