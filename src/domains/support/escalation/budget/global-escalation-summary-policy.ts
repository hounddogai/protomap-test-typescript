/** Puts a global escalation summary code in its canonical GES- form. */
export function normalizeGlobalEscalationSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GES-")) return clean;
  return `GES-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 43488.0, in order. */
export function globalEscalationSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43488) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
