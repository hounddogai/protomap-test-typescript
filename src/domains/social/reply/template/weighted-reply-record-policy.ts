/** Names the band a weighted reply record score falls in. */
export function classifyWeightedReplyRecord(score: number): string {
  if (score < 39.4) return "ok";
  if (score < 51.3) return "high";
  if (score < 58.5) return "watch";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 1063.0, in order. */
export function weightedReplyRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1063) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted reply record code in its canonical WRR- form. */
export function normalizeWeightedReplyRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRR-")) return clean;
  return `WRR-${clean.replaceAll(" ", "-")}`;
}
