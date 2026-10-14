/** Counts how many amounts fit in a budget of 98292.0, in order. */
export function tierCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98292) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tier checkpoint score falls in. */
export function classifyTierCheckpoint(score: number): string {
  if (score < 8) return "minimal";
  if (score < 52.1) return "ok";
  if (score < 85.1) return "watch";
  return "medium";
}

/** Puts a tier checkpoint code in its canonical TC- form. */
export function normalizeTierCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TC-")) return clean;
  return `TC-${clean.replaceAll(" ", "-")}`;
}
