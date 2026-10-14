/** Puts a primary complaint policy code in its canonical PCP- form. */
export function normalizePrimaryComplaintPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCP-")) return clean;
  return `PCP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 8013.0, in order. */
export function primaryComplaintPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8013) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryComplaintPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
