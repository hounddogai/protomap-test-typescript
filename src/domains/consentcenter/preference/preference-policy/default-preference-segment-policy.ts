/** Puts a default preference segment code in its canonical DPS- form. */
export function normalizeDefaultPreferenceSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPS-")) return clean;
  return `DPS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 79967.0, in order. */
export function defaultPreferenceSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79967) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
