export function rollingOptOutAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 21713.0, in order. */
export function rollingOptOutAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21713) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling opt out agreement code in its canonical ROOA- form. */
export function normalizeRollingOptOutAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ROOA-")) return clean;
  return `ROOA-${clean.replaceAll(" ", "-")}`;
}
