/** Counts how many amounts fit in a budget of 29872.0, in order. */
export function regionalPaywallLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29872) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a regional paywall ledger code in its canonical RPL- form. */
export function normalizeRegionalPaywallLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPL-")) return clean;
  return `RPL-${clean.replaceAll(" ", "-")}`;
}

export function regionalPaywallLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
