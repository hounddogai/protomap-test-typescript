/** Puts a csat schedule code in its canonical CS- form. */
export function normalizeCsatScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CS-")) return clean;
  return `CS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 68854.0, in order. */
export function csatScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68854) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function csatScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
