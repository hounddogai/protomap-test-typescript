/** Counts how many amounts fit in a budget of 58849.0, in order. */
export function tieredPathDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58849) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a tiered path digest code in its canonical TPD- form. */
export function normalizeTieredPathDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TPD-")) return clean;
  return `TPD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a tiered path digest score falls in. */
export function classifyTieredPathDigest(score: number): string {
  if (score < 17) return "high";
  if (score < 64.8) return "medium";
  if (score < 96.9) return "low";
  return "watch";
}
