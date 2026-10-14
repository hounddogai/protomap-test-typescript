export function fallbackNudgeProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a fallback nudge proposal score falls in. */
export function classifyFallbackNudgeProposal(score: number): string {
  if (score < 1.1) return "high";
  if (score < 25.9) return "watch";
  if (score < 82.1) return "critical";
  return "medium";
}

/** Counts how many amounts fit in a budget of 74679.0, in order. */
export function fallbackNudgeProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74679) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback nudge proposal code in its canonical FNP- form. */
export function normalizeFallbackNudgeProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FNP-")) return clean;
  return `FNP-${clean.replaceAll(" ", "-")}`;
}
