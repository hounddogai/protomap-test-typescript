/** Puts a window request code in its canonical WR- form. */
export function normalizeWindowRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WR-")) return clean;
  return `WR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 13340.0, in order. */
export function windowRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13340) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
