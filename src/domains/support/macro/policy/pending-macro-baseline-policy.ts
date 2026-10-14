/** Counts how many amounts fit in a budget of 48479.0, in order. */
export function pendingMacroBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48479) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pendingMacroBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a pending macro baseline score falls in. */
export function classifyPendingMacroBaseline(score: number): string {
  if (score < 34.8) return "high";
  if (score < 46.3) return "medium";
  if (score < 46.8) return "minimal";
  return "ok";
}
