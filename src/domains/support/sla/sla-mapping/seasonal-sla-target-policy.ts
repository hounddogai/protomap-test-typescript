export function seasonalSlaTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a seasonal sla target code in its canonical SST- form. */
export function normalizeSeasonalSlaTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SST-")) return clean;
  return `SST-${clean.replaceAll(" ", "-")}`;
}
