/** Counts how many amounts fit in a budget of 49249.0, in order. */
export function defaultFrequencySnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49249) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default frequency snapshot score falls in. */
export function classifyDefaultFrequencySnapshot(score: number): string {
  if (score < 39) return "high";
  if (score < 77.3) return "minimal";
  if (score < 79.5) return "medium";
  if (score < 83.6) return "elevated";
  return "low";
}

/** Puts a default frequency snapshot code in its canonical DFS- form. */
export function normalizeDefaultFrequencySnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DFS-")) return clean;
  return `DFS-${clean.replaceAll(" ", "-")}`;
}
