/** Names the band a regional double opt in record score falls in. */
export function classifyRegionalDoubleOptInRecord(score: number): string {
  if (score < 11.7) return "elevated";
  if (score < 35.3) return "ok";
  if (score < 37.1) return "critical";
  if (score < 43.6) return "minimal";
  return "low";
}

/** Counts how many amounts fit in a budget of 49607.0, in order. */
export function regionalDoubleOptInRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49607) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
