/** Puts a rolling journey slot code in its canonical RJS- form. */
export function normalizeRollingJourneySlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RJS-")) return clean;
  return `RJS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 88290.0, in order. */
export function rollingJourneySlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88290) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
