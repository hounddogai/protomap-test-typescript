/** Counts how many amounts fit in a budget of 56195.0, in order. */
export function cappedSlaTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56195) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped sla target score falls in. */
export function classifyCappedSlaTarget(score: number): string {
  if (score < 7.8) return "watch";
  if (score < 26.2) return "ok";
  if (score < 33.3) return "medium";
  return "critical";
}
