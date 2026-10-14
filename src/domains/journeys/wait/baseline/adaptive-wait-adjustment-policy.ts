/** Counts how many amounts fit in a budget of 14909.0, in order. */
export function adaptiveWaitAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14909) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a adaptive wait adjustment code in its canonical AWA- form. */
export function normalizeAdaptiveWaitAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AWA-")) return clean;
  return `AWA-${clean.replaceAll(" ", "-")}`;
}
