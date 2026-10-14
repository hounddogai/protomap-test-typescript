export function legacyPlacementSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a legacy placement slot score falls in. */
export function classifyLegacyPlacementSlot(score: number): string {
  if (score < 32.7) return "critical";
  if (score < 35.4) return "medium";
  if (score < 46.8) return "high";
  if (score < 75.4) return "low";
  return "elevated";
}

/** Puts a legacy placement slot code in its canonical LPS- form. */
export function normalizeLegacyPlacementSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPS-")) return clean;
  return `LPS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 7758.0, in order. */
export function legacyPlacementSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7758) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
