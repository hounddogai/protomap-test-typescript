/** Counts how many amounts fit in a budget of 79295.0, in order. */
export function deflectionScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79295) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a deflection score code in its canonical DS- form. */
export function normalizeDeflectionScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DS-")) return clean;
  return `DS-${clean.replaceAll(" ", "-")}`;
}
