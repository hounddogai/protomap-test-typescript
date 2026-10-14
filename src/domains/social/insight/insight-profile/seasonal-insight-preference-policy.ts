/** Puts a seasonal insight preference code in its canonical SIP- form. */
export function normalizeSeasonalInsightPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIP-")) return clean;
  return `SIP-${clean.replaceAll(" ", "-")}`;
}

export function seasonalInsightPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
