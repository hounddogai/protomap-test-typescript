export function rollingWindowSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Puts a rolling window summary code in its canonical RWS- form. */
export function normalizeRollingWindowSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RWS-")) return clean;
  return `RWS-${clean.replaceAll(" ", "-")}`;
}
