/** Puts a pending reward rollup code in its canonical PRR- form. */
export function normalizePendingRewardRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PRR-")) return clean;
  return `PRR-${clean.replaceAll(" ", "-")}`;
}

export function pendingRewardRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
