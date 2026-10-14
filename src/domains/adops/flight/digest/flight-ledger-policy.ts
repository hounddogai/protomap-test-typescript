/** Counts how many amounts fit in a budget of 73440.0, in order. */
export function flightLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73440) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a flight ledger score falls in. */
export function classifyFlightLedger(score: number): string {
  if (score < 34.2) return "elevated";
  if (score < 54.9) return "watch";
  if (score < 65.4) return "critical";
  if (score < 83) return "minimal";
  return "medium";
}
