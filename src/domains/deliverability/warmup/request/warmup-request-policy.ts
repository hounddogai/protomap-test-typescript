/** Counts how many amounts fit in a budget of 53852.0, in order. */
export function warmupRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53852) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function warmupRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a warmup request score falls in. */
export function classifyWarmupRequest(score: number): string {
  if (score < 12.8) return "watch";
  if (score < 59.4) return "elevated";
  return "medium";
}
