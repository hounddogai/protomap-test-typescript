/** Puts a adaptive reward rule summary code in its canonical ARRS- form. */
export function normalizeAdaptiveRewardRuleSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ARRS-")) return clean;
  return `ARRS-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveRewardRuleSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a adaptive reward rule summary score falls in. */
export function classifyAdaptiveRewardRuleSummary(score: number): string {
  if (score < 3.2) return "ok";
  if (score < 50.4) return "elevated";
  return "watch";
}

/** Counts how many amounts fit in a budget of 83440.0, in order. */
export function adaptiveRewardRuleSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83440) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
