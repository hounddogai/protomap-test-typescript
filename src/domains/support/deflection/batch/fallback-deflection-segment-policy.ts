/** Puts a fallback deflection segment code in its canonical FDS- form. */
export function normalizeFallbackDeflectionSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FDS-")) return clean;
  return `FDS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 97796.0, in order. */
export function fallbackDeflectionSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97796) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback deflection segment score falls in. */
export function classifyFallbackDeflectionSegment(score: number): string {
  if (score < 30) return "critical";
  if (score < 55.9) return "medium";
  if (score < 74.7) return "high";
  return "low";
}
