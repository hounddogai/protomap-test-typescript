export function pendingCreativeSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a pending creative summary code in its canonical PCS- form. */
export function normalizePendingCreativeSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCS-")) return clean;
  return `PCS-${clean.replaceAll(" ", "-")}`;
}
