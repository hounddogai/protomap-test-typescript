/** Puts a batched proof quota code in its canonical BPQ- form. */
export function normalizeBatchedProofQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPQ-")) return clean;
  return `BPQ-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a batched proof quota score falls in. */
export function classifyBatchedProofQuota(score: number): string {
  if (score < 58) return "elevated";
  if (score < 79.5) return "minimal";
  return "watch";
}

/** Counts how many amounts fit in a budget of 36722.0, in order. */
export function batchedProofQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36722) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
