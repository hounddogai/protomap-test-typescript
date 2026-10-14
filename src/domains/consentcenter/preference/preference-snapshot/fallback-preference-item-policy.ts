export function fallbackPreferenceItemSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Puts a fallback preference item code in its canonical FPI- form. */
export function normalizeFallbackPreferenceItemCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FPI-")) return clean;
  return `FPI-${clean.replaceAll(" ", "-")}`;
}
