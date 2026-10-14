export function primaryPacingMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a primary pacing metric code in its canonical PPM- form. */
export function normalizePrimaryPacingMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPM-")) return clean;
  return `PPM-${clean.replaceAll(" ", "-")}`;
}
