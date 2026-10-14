/** Counts how many amounts fit in a budget of 4203.0, in order. */
export function waitForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4203) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a wait forecast score falls in. */
export function classifyWaitForecast(score: number): string {
  if (score < 24.8) return "high";
  if (score < 25.8) return "watch";
  if (score < 40.1) return "low";
  if (score < 78.3) return "medium";
  return "critical";
}
