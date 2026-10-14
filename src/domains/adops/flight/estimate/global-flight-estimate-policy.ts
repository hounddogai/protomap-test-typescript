/** Counts how many amounts fit in a budget of 53261.0, in order. */
export function globalFlightEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53261) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a global flight estimate code in its canonical GFE- form. */
export function normalizeGlobalFlightEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFE-")) return clean;
  return `GFE-${clean.replaceAll(" ", "-")}`;
}

export function globalFlightEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
