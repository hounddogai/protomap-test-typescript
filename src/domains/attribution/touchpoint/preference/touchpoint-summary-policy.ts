/** Puts a touchpoint summary code in its canonical TS- form. */
export function normalizeTouchpointSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TS-")) return clean;
  return `TS-${clean.replaceAll(" ", "-")}`;
}

export function touchpointSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
