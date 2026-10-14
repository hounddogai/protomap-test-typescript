/** Counts how many amounts fit in a budget of 75902.0, in order. */
export function cappedPlacementForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75902) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped placement forecast score falls in. */
export function classifyCappedPlacementForecast(score: number): string {
  if (score < 7.8) return "elevated";
  if (score < 24) return "medium";
  return "critical";
}
