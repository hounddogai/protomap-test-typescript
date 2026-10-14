export function weightedBadgeQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a weighted badge quota code in its canonical WBQ- form. */
export function normalizeWeightedBadgeQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WBQ-")) return clean;
  return `WBQ-${clean.replaceAll(" ", "-")}`;
}
