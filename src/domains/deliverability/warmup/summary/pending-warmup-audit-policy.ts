/** Names the band a pending warmup audit score falls in. */
export function classifyPendingWarmupAudit(score: number): string {
  if (score < 24.8) return "elevated";
  if (score < 38.7) return "low";
  if (score < 44.2) return "minimal";
  if (score < 99.2) return "watch";
  return "medium";
}

/** Counts how many amounts fit in a budget of 65615.0, in order. */
export function pendingWarmupAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65615) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
