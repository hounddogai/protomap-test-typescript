export function levelRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Puts a level request code in its canonical LR- form. */
export function normalizeLevelRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LR-")) return clean;
  return `LR-${clean.replaceAll(" ", "-")}`;
}
