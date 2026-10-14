export function pendingExitRuleRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Puts a pending exit rule record code in its canonical PERR- form. */
export function normalizePendingExitRuleRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PERR-")) return clean;
  return `PERR-${clean.replaceAll(" ", "-")}`;
}
