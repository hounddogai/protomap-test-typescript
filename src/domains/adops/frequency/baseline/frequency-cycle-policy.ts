/** Names the band a frequency cycle score falls in. */
export function classifyFrequencyCycle(score: number): string {
  if (score < 3.3) return "elevated";
  if (score < 42.8) return "critical";
  if (score < 96.7) return "low";
  if (score < 99.8) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 96987.0, in order. */
export function frequencyCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96987) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
