export function frequencySummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a frequency summary score falls in. */
export function classifyFrequencySummary(score: number): string {
  if (score < 36.2) return "critical";
  if (score < 45.5) return "minimal";
  if (score < 65.2) return "elevated";
  return "medium";
}

/** Counts how many amounts fit in a budget of 48485.0, in order. */
export function frequencySummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48485) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
