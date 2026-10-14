/** Counts how many amounts fit in a budget of 82708.0, in order. */
export function doubleOptInProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82708) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a double opt in proposal code in its canonical DOIP- form. */
export function normalizeDoubleOptInProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIP-")) return clean;
  return `DOIP-${clean.replaceAll(" ", "-")}`;
}

export function doubleOptInProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
