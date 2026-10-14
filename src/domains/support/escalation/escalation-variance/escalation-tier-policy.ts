/** Puts a escalation tier code in its canonical ET- form. */
export function normalizeEscalationTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ET-")) return clean;
  return `ET-${clean.replaceAll(" ", "-")}`;
}

export function escalationTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
