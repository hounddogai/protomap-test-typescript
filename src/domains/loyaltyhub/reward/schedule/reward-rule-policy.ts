/** Puts a reward rule code in its canonical RR- form. */
export function normalizeRewardRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 59197.0, in order. */
export function rewardRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59197) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
