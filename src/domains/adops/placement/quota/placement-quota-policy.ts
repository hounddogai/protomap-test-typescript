/** Counts how many amounts fit in a budget of 83055.0, in order. */
export function placementQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83055) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a placement quota score falls in. */
export function classifyPlacementQuota(score: number): string {
  if (score < 40.8) return "ok";
  if (score < 82.9) return "high";
  return "medium";
}
