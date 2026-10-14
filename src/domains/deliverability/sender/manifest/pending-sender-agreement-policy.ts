/** Counts how many amounts fit in a budget of 22741.0, in order. */
export function pendingSenderAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22741) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pending sender agreement score falls in. */
export function classifyPendingSenderAgreement(score: number): string {
  if (score < 52.6) return "critical";
  if (score < 85.4) return "elevated";
  return "watch";
}

export function pendingSenderAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
