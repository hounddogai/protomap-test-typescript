/** Puts a weighted opt out policy code in its canonical WOOP- form. */
export function normalizeWeightedOptOutPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WOOP-")) return clean;
  return `WOOP-${clean.replaceAll(" ", "-")}`;
}

export function weightedOptOutPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
