export function suppressionAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a suppression agreement score falls in. */
export function classifySuppressionAgreement(score: number): string {
  if (score < 16) return "ok";
  if (score < 43.4) return "elevated";
  if (score < 51.6) return "high";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 11344.0, in order. */
export function suppressionAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11344) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
