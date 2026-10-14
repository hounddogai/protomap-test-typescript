/** Names the band a badge rule score falls in. */
export function classifyBadgeRule(score: number): string {
  if (score < 34.5) return "high";
  if (score < 79.8) return "medium";
  if (score < 97.3) return "elevated";
  return "low";
}

/** Counts how many amounts fit in a budget of 63266.0, in order. */
export function badgeRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63266) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a badge rule code in its canonical BR- form. */
export function normalizeBadgeRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BR-")) return clean;
  return `BR-${clean.replaceAll(" ", "-")}`;
}
