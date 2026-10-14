/** Counts how many amounts fit in a budget of 25138.0, in order. */
export function paywallRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25138) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a paywall rule code in its canonical PR- form. */
export function normalizePaywallRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}
