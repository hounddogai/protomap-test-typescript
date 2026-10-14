export function pendingPathRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a pending path record code in its canonical PPR- form. */
export function normalizePendingPathRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPR-")) return clean;
  return `PPR-${clean.replaceAll(" ", "-")}`;
}
