/** Names the band a regional approval group score falls in. */
export function classifyRegionalApprovalGroup(score: number): string {
  if (score < 23.1) return "elevated";
  if (score < 23.7) return "minimal";
  if (score < 52.6) return "medium";
  if (score < 60.1) return "watch";
  return "ok";
}

/** Counts how many amounts fit in a budget of 18250.0, in order. */
export function regionalApprovalGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18250) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a regional approval group code in its canonical RAG- form. */
export function normalizeRegionalApprovalGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAG-")) return clean;
  return `RAG-${clean.replaceAll(" ", "-")}`;
}
