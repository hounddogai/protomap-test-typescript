/** Puts a tiered wait group code in its canonical TWG- form. */
export function normalizeTieredWaitGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TWG-")) return clean;
  return `TWG-${clean.replaceAll(" ", "-")}`;
}

export function tieredWaitGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
