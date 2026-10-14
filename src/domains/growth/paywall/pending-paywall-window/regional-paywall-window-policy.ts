/** Puts a regional paywall window code in its canonical RPW- form. */
export function normalizeRegionalPaywallWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPW-")) return clean;
  return `RPW-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 90906.0, in order. */
export function regionalPaywallWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90906) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
