/** Puts a double opt in audit code in its canonical DOIA- form. */
export function normalizeDoubleOptInAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIA-")) return clean;
  return `DOIA-${clean.replaceAll(" ", "-")}`;
}

export function doubleOptInAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
