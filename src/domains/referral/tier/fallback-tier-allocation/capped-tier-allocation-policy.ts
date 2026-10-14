/** Puts a capped tier allocation code in its canonical CTA- form. */
export function normalizeCappedTierAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CTA-")) return clean;
  return `CTA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 65115.0, in order. */
export function cappedTierAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65115) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
