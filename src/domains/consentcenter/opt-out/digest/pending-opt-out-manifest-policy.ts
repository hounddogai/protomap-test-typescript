/** Counts how many amounts fit in a budget of 93360.0, in order. */
export function pendingOptOutManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93360) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pending opt out manifest score falls in. */
export function classifyPendingOptOutManifest(score: number): string {
  if (score < 87.2) return "critical";
  if (score < 90.1) return "ok";
  if (score < 93.9) return "elevated";
  return "medium";
}
