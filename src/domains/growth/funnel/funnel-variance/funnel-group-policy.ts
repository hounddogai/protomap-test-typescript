export function funnelGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Puts a funnel group code in its canonical FG- form. */
export function normalizeFunnelGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FG-")) return clean;
  return `FG-${clean.replaceAll(" ", "-")}`;
}
