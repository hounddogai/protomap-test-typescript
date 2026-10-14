/** Counts how many amounts fit in a budget of 15821.0, in order. */
export function fraudCheckEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15821) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fraud check entry score falls in. */
export function classifyFraudCheckEntry(score: number): string {
  if (score < 42.1) return "medium";
  if (score < 48.2) return "watch";
  if (score < 55.6) return "elevated";
  return "ok";
}

export function fraudCheckEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
