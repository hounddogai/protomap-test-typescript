/** Counts how many amounts fit in a budget of 92480.0, in order. */
export function strictBranchManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92480) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict branch manifest score falls in. */
export function classifyStrictBranchManifest(score: number): string {
  if (score < 38.2) return "medium";
  if (score < 50.1) return "ok";
  if (score < 91) return "watch";
  if (score < 95.1) return "elevated";
  return "minimal";
}
