/** Puts a legacy branch slot code in its canonical LBS- form. */
export function normalizeLegacyBranchSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LBS-")) return clean;
  return `LBS-${clean.replaceAll(" ", "-")}`;
}

export function legacyBranchSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
