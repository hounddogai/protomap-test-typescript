/** Counts how many amounts fit in a budget of 85155.0, in order. */
export function modelRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85155) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a model rollup code in its canonical MR- form. */
export function normalizeModelRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MR-")) return clean;
  return `MR-${clean.replaceAll(" ", "-")}`;
}
