/** Puts a capped insight metric code in its canonical CIM- form. */
export function normalizeCappedInsightMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CIM-")) return clean;
  return `CIM-${clean.replaceAll(" ", "-")}`;
}

export function cappedInsightMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
