export function globalRewardEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Puts a global reward estimate code in its canonical GRE- form. */
export function normalizeGlobalRewardEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRE-")) return clean;
  return `GRE-${clean.replaceAll(" ", "-")}`;
}
