/** Puts a strict insight rollup code in its canonical SIR- form. */
export function normalizeStrictInsightRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIR-")) return clean;
  return `SIR-${clean.replaceAll(" ", "-")}`;
}

export function strictInsightRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
