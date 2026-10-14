/** Counts how many amounts fit in a budget of 74711.0, in order. */
export function seasonalModelCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74711) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal model checkpoint code in its canonical SMC- form. */
export function normalizeSeasonalModelCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMC-")) return clean;
  return `SMC-${clean.replaceAll(" ", "-")}`;
}

export function seasonalModelCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a seasonal model checkpoint score falls in. */
export function classifySeasonalModelCheckpoint(score: number): string {
  if (score < 5.8) return "watch";
  if (score < 13.1) return "high";
  if (score < 30.8) return "medium";
  return "critical";
}
