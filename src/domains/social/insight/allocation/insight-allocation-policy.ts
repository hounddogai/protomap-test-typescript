/** Puts a insight allocation code in its canonical IA- form. */
export function normalizeInsightAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IA-")) return clean;
  return `IA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a insight allocation score falls in. */
export function classifyInsightAllocation(score: number): string {
  if (score < 59.3) return "medium";
  if (score < 63.1) return "high";
  return "ok";
}

/** Counts how many amounts fit in a budget of 49885.0, in order. */
export function insightAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49885) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
