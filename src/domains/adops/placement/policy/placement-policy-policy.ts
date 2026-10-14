export function placementPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Puts a placement policy code in its canonical PP- form. */
export function normalizePlacementPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a placement policy score falls in. */
export function classifyPlacementPolicy(score: number): string {
  if (score < 64.1) return "high";
  if (score < 66.1) return "critical";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 85964.0, in order. */
export function placementPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85964) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
