/** Counts how many amounts fit in a budget of 80218.0, in order. */
export function retentionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80218) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a retention baseline score falls in. */
export function classifyRetentionBaseline(score: number): string {
  if (score < 3.2) return "ok";
  if (score < 13.5) return "low";
  if (score < 53.2) return "watch";
  return "medium";
}

/** Puts a retention baseline code in its canonical RB- form. */
export function normalizeRetentionBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RB-")) return clean;
  return `RB-${clean.replaceAll(" ", "-")}`;
}
