/** Names the band a capped mention record score falls in. */
export function classifyCappedMentionRecord(score: number): string {
  if (score < 9) return "ok";
  if (score < 20.6) return "minimal";
  if (score < 35.4) return "elevated";
  return "critical";
}

/** Puts a capped mention record code in its canonical CMR- form. */
export function normalizeCappedMentionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CMR-")) return clean;
  return `CMR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 5360.0, in order. */
export function cappedMentionRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5360) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
