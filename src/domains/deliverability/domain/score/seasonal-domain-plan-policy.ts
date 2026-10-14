/** Counts how many amounts fit in a budget of 1970.0, in order. */
export function seasonalDomainPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1970) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal domain plan code in its canonical SDP- form. */
export function normalizeSeasonalDomainPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDP-")) return clean;
  return `SDP-${clean.replaceAll(" ", "-")}`;
}
