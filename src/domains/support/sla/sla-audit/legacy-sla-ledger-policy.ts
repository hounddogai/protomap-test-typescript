/** Counts how many amounts fit in a budget of 95682.0, in order. */
export function legacySlaLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95682) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacySlaLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a legacy sla ledger score falls in. */
export function classifyLegacySlaLedger(score: number): string {
  if (score < 35.7) return "watch";
  if (score < 88.1) return "elevated";
  return "minimal";
}

/** Puts a legacy sla ledger code in its canonical LSL- form. */
export function normalizeLegacySlaLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSL-")) return clean;
  return `LSL-${clean.replaceAll(" ", "-")}`;
}
