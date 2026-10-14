/** Puts a adaptive branch cycle code in its canonical ABC- form. */
export function normalizeAdaptiveBranchCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ABC-")) return clean;
  return `ABC-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveBranchCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
