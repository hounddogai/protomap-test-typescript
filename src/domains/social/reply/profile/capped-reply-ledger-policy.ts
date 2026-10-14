/** Counts how many amounts fit in a budget of 74315.0, in order. */
export function cappedReplyLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74315) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped reply ledger score falls in. */
export function classifyCappedReplyLedger(score: number): string {
  if (score < 44.4) return "ok";
  if (score < 60.5) return "medium";
  if (score < 92) return "critical";
  if (score < 93.2) return "minimal";
  return "low";
}
