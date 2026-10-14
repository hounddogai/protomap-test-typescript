/** Puts a complaint forecast code in its canonical CF- form. */
export function normalizeComplaintForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CF-")) return clean;
  return `CF-${clean.replaceAll(" ", "-")}`;
}

export function complaintForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
