/** Counts how many amounts fit in a budget of 44344.0, in order. */
export function rollingComplaintPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44344) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling complaint policy code in its canonical RCP- form. */
export function normalizeRollingComplaintPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCP-")) return clean;
  return `RCP-${clean.replaceAll(" ", "-")}`;
}
