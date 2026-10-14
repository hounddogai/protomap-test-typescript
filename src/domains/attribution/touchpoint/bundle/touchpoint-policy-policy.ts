/** Puts a touchpoint policy code in its canonical TP- form. */
export function normalizeTouchpointPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TP-")) return clean;
  return `TP-${clean.replaceAll(" ", "-")}`;
}

export function touchpointPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
