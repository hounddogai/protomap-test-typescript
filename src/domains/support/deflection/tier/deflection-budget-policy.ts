/** Counts how many amounts fit in a budget of 34559.0, in order. */
export function deflectionBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34559) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a deflection budget code in its canonical DB- form. */
export function normalizeDeflectionBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DB-")) return clean;
  return `DB-${clean.replaceAll(" ", "-")}`;
}
