/** Counts how many amounts fit in a budget of 57392.0, in order. */
export function primaryPacingPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57392) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary pacing plan code in its canonical PPP- form. */
export function normalizePrimaryPacingPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPP-")) return clean;
  return `PPP-${clean.replaceAll(" ", "-")}`;
}
