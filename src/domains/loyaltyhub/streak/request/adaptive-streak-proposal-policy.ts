/** Names the band a adaptive streak proposal score falls in. */
export function classifyAdaptiveStreakProposal(score: number): string {
  if (score < 5.4) return "elevated";
  if (score < 45.5) return "high";
  return "minimal";
}

export function adaptiveStreakProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 95235.0, in order. */
export function adaptiveStreakProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95235) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a adaptive streak proposal code in its canonical ASP- form. */
export function normalizeAdaptiveStreakProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ASP-")) return clean;
  return `ASP-${clean.replaceAll(" ", "-")}`;
}
