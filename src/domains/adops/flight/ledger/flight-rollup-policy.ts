/** Names the band a flight rollup score falls in. */
export function classifyFlightRollup(score: number): string {
  if (score < 17.5) return "minimal";
  if (score < 59.9) return "low";
  if (score < 81.3) return "critical";
  if (score < 91.2) return "watch";
  return "ok";
}

/** Counts how many amounts fit in a budget of 17461.0, in order. */
export function flightRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17461) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
