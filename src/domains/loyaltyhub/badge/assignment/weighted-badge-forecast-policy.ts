/** Puts a weighted badge forecast code in its canonical WBF- form. */
export function normalizeWeightedBadgeForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WBF-")) return clean;
  return `WBF-${clean.replaceAll(" ", "-")}`;
}

export function weightedBadgeForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
