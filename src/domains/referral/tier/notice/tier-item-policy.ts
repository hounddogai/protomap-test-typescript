export function tierItemSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a tier item code in its canonical TI- form. */
export function normalizeTierItemCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TI-")) return clean;
  return `TI-${clean.replaceAll(" ", "-")}`;
}
