export function tierRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a tier rule code in its canonical TR- form. */
export function normalizeTierRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TR-")) return clean;
  return `TR-${clean.replaceAll(" ", "-")}`;
}
