/** Puts a default redemption variance code in its canonical DRV- form. */
export function normalizeDefaultRedemptionVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DRV-")) return clean;
  return `DRV-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 79299.0, in order. */
export function defaultRedemptionVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79299) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default redemption variance score falls in. */
export function classifyDefaultRedemptionVariance(score: number): string {
  if (score < 8.7) return "watch";
  if (score < 40.7) return "elevated";
  if (score < 56.3) return "high";
  if (score < 83.1) return "critical";
  return "low";
}
