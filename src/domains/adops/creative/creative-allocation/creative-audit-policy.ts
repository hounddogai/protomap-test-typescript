export function creativeAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a creative audit score falls in. */
export function classifyCreativeAudit(score: number): string {
  if (score < 28.3) return "elevated";
  if (score < 49.2) return "minimal";
  if (score < 79.4) return "low";
  return "ok";
}

/** Counts how many amounts fit in a budget of 57155.0, in order. */
export function creativeAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57155) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
