/** Puts a sla assignment code in its canonical SA- form. */
export function normalizeSlaAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SA-")) return clean;
  return `SA-${clean.replaceAll(" ", "-")}`;
}

export function slaAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
