/** Names the band a legacy activation ledger score falls in. */
export function classifyLegacyActivationLedger(score: number): string {
  if (score < 23.6) return "high";
  if (score < 28.7) return "medium";
  if (score < 97.4) return "watch";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 56121.0, in order. */
export function legacyActivationLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56121) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
