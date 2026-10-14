/** Puts a path rule code in its canonical PR- form. */
export function normalizePathRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 92848.0, in order. */
export function pathRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92848) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
