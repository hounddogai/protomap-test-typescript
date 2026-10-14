/** Counts how many amounts fit in a budget of 82667.0, in order. */
export function defaultPacingSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82667) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a default pacing summary code in its canonical DPS- form. */
export function normalizeDefaultPacingSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPS-")) return clean;
  return `DPS-${clean.replaceAll(" ", "-")}`;
}

export function defaultPacingSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
