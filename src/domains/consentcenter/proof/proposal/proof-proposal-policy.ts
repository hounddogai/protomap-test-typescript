/** Names the band a proof proposal score falls in. */
export function classifyProofProposal(score: number): string {
  if (score < 5.7) return "minimal";
  if (score < 25) return "low";
  if (score < 52.6) return "ok";
  if (score < 66.4) return "medium";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 41766.0, in order. */
export function proofProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41766) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a proof proposal code in its canonical PP- form. */
export function normalizeProofProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}
