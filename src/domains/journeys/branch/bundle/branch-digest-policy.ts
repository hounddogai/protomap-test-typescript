/** Names the band a branch digest score falls in. */
export function classifyBranchDigest(score: number): string {
  if (score < 37.1) return "medium";
  if (score < 78.1) return "watch";
  if (score < 87.7) return "elevated";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 41382.0, in order. */
export function branchDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41382) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
