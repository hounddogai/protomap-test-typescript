/** Puts a default streak rule code in its canonical DSR- form. */
export function normalizeDefaultStreakRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DSR-")) return clean;
  return `DSR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 55109.0, in order. */
export function defaultStreakRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55109) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
