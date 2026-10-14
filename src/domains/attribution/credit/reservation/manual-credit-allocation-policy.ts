/** Names the band a manual credit allocation score falls in. */
export function classifyManualCreditAllocation(score: number): string {
  if (score < 28.2) return "ok";
  if (score < 88.5) return "low";
  return "medium";
}

/** Counts how many amounts fit in a budget of 89457.0, in order. */
export function manualCreditAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89457) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualCreditAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a manual credit allocation code in its canonical MCA- form. */
export function normalizeManualCreditAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MCA-")) return clean;
  return `MCA-${clean.replaceAll(" ", "-")}`;
}
