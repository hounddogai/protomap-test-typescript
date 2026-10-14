/** Puts a scheduled branch adjustment code in its canonical SBA- form. */
export function normalizeScheduledBranchAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBA-")) return clean;
  return `SBA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 20671.0, in order. */
export function scheduledBranchAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20671) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a scheduled branch adjustment score falls in. */
export function classifyScheduledBranchAdjustment(score: number): string {
  if (score < 68.2) return "watch";
  if (score < 99.8) return "high";
  return "elevated";
}
