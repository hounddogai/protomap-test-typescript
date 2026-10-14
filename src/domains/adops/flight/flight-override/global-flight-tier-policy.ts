/** Puts a global flight tier code in its canonical GFT- form. */
export function normalizeGlobalFlightTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFT-")) return clean;
  return `GFT-${clean.replaceAll(" ", "-")}`;
}

export function globalFlightTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
