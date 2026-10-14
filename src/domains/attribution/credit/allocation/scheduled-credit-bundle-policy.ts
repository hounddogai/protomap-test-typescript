/** Counts how many amounts fit in a budget of 15273.0, in order. */
export function scheduledCreditBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15273) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledCreditBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a scheduled credit bundle score falls in. */
export function classifyScheduledCreditBundle(score: number): string {
  if (score < 10.7) return "watch";
  if (score < 22.2) return "medium";
  if (score < 38.7) return "high";
  if (score < 62.8) return "ok";
  return "elevated";
}
