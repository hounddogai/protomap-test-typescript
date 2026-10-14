/** Counts how many amounts fit in a budget of 8753.0, in order. */
export function primaryMacroPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8753) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary macro policy code in its canonical PMP- form. */
export function normalizePrimaryMacroPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PMP-")) return clean;
  return `PMP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary macro policy score falls in. */
export function classifyPrimaryMacroPolicy(score: number): string {
  if (score < 12.5) return "high";
  if (score < 38.2) return "low";
  return "elevated";
}
