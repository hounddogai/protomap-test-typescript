/** Counts how many amounts fit in a budget of 20166.0, in order. */
export function defaultRetentionBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20166) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default retention batch score falls in. */
export function classifyDefaultRetentionBatch(score: number): string {
  if (score < 32.8) return "minimal";
  if (score < 36) return "medium";
  if (score < 66) return "elevated";
  return "ok";
}

/** Puts a default retention batch code in its canonical DRB- form. */
export function normalizeDefaultRetentionBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DRB-")) return clean;
  return `DRB-${clean.replaceAll(" ", "-")}`;
}
