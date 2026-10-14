/** Names the band a primary redemption variance score falls in. */
export function classifyPrimaryRedemptionVariance(score: number): string {
  if (score < 7.8) return "high";
  if (score < 50.6) return "medium";
  if (score < 61.7) return "low";
  if (score < 94.7) return "elevated";
  return "critical";
}

/** Counts how many amounts fit in a budget of 93372.0, in order. */
export function primaryRedemptionVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93372) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary redemption variance code in its canonical PRV- form. */
export function normalizePrimaryRedemptionVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PRV-")) return clean;
  return `PRV-${clean.replaceAll(" ", "-")}`;
}
