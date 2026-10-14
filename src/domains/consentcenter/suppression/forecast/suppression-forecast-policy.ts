/** Puts a suppression forecast code in its canonical SF- form. */
export function normalizeSuppressionForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SF-")) return clean;
  return `SF-${clean.replaceAll(" ", "-")}`;
}

export function suppressionForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
