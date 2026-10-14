/** Puts a reward rule agreement code in its canonical RRA- form. */
export function normalizeRewardRuleAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRA-")) return clean;
  return `RRA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 63484.0, in order. */
export function rewardRuleAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63484) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
