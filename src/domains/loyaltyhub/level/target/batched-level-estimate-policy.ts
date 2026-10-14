/** Puts a batched level estimate code in its canonical BLE- form. */
export function normalizeBatchedLevelEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BLE-")) return clean;
  return `BLE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 27672.0, in order. */
export function batchedLevelEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27672) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedLevelEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a batched level estimate score falls in. */
export function classifyBatchedLevelEstimate(score: number): string {
  if (score < 33.2) return "ok";
  if (score < 47.7) return "minimal";
  return "low";
}
