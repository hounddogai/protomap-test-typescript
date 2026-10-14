export function seasonalMacroRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a seasonal macro request code in its canonical SMR- form. */
export function normalizeSeasonalMacroRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMR-")) return clean;
  return `SMR-${clean.replaceAll(" ", "-")}`;
}
