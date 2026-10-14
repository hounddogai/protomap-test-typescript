/** Puts a scheduled path entry code in its canonical SPE- form. */
export function normalizeScheduledPathEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPE-")) return clean;
  return `SPE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 52024.0, in order. */
export function scheduledPathEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52024) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
