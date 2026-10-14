/** Counts how many amounts fit in a budget of 21385.0, in order. */
export function insightSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21385) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a insight summary code in its canonical IS- form. */
export function normalizeInsightSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IS-")) return clean;
  return `IS-${clean.replaceAll(" ", "-")}`;
}

export function insightSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
