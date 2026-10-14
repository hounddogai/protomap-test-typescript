export function strictPacingAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a strict pacing adjustment code in its canonical SPA- form. */
export function normalizeStrictPacingAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPA-")) return clean;
  return `SPA-${clean.replaceAll(" ", "-")}`;
}
