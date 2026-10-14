/** Puts a scheduled touchpoint forecast code in its canonical STF- form. */
export function normalizeScheduledTouchpointForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STF-")) return clean;
  return `STF-${clean.replaceAll(" ", "-")}`;
}

export function scheduledTouchpointForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
