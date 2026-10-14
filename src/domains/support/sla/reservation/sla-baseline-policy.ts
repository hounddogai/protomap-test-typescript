/** Counts how many amounts fit in a budget of 92326.0, in order. */
export function slaBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92326) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a sla baseline code in its canonical SB- form. */
export function normalizeSlaBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SB-")) return clean;
  return `SB-${clean.replaceAll(" ", "-")}`;
}

export function slaBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
