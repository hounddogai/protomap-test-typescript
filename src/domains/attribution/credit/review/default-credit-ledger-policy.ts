/** Counts how many amounts fit in a budget of 65020.0, in order. */
export function defaultCreditLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65020) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default credit ledger score falls in. */
export function classifyDefaultCreditLedger(score: number): string {
  if (score < 36.9) return "minimal";
  if (score < 95.5) return "watch";
  return "elevated";
}

export function defaultCreditLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
