export function weightedPlacementRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a weighted placement record code in its canonical WPR- form. */
export function normalizeWeightedPlacementRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPR-")) return clean;
  return `WPR-${clean.replaceAll(" ", "-")}`;
}
