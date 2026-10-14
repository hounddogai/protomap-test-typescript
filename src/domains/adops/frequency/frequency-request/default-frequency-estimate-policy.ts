/** Counts how many amounts fit in a budget of 73917.0, in order. */
export function defaultFrequencyEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73917) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default frequency estimate score falls in. */
export function classifyDefaultFrequencyEstimate(score: number): string {
  if (score < 10.7) return "critical";
  if (score < 41.6) return "elevated";
  if (score < 57.4) return "low";
  if (score < 69.4) return "minimal";
  return "high";
}

/** Puts a default frequency estimate code in its canonical DFE- form. */
export function normalizeDefaultFrequencyEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DFE-")) return clean;
  return `DFE-${clean.replaceAll(" ", "-")}`;
}
