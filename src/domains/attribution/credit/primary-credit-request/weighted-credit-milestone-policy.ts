export function weightedCreditMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a weighted credit milestone code in its canonical WCM- form. */
export function normalizeWeightedCreditMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WCM-")) return clean;
  return `WCM-${clean.replaceAll(" ", "-")}`;
}
