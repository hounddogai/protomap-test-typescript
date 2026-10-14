/** Counts how many amounts fit in a budget of 14074.0, in order. */
export function windowProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14074) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a window proposal code in its canonical WP- form. */
export function normalizeWindowProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WP-")) return clean;
  return `WP-${clean.replaceAll(" ", "-")}`;
}
