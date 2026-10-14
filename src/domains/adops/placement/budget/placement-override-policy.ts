/** Counts how many amounts fit in a budget of 56043.0, in order. */
export function placementOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56043) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a placement override code in its canonical PO- form. */
export function normalizePlacementOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PO-")) return clean;
  return `PO-${clean.replaceAll(" ", "-")}`;
}
