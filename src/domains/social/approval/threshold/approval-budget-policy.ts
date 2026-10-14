/** Counts how many amounts fit in a budget of 7718.0, in order. */
export function approvalBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7718) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a approval budget code in its canonical AB- form. */
export function normalizeApprovalBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AB-")) return clean;
  return `AB-${clean.replaceAll(" ", "-")}`;
}
