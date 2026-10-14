/** Names the band a weighted challenge allocation score falls in. */
export function classifyWeightedChallengeAllocation(score: number): string {
  if (score < 33.4) return "medium";
  if (score < 72.7) return "ok";
  if (score < 73.9) return "elevated";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 12716.0, in order. */
export function weightedChallengeAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12716) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted challenge allocation code in its canonical WCA- form. */
export function normalizeWeightedChallengeAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WCA-")) return clean;
  return `WCA-${clean.replaceAll(" ", "-")}`;
}
