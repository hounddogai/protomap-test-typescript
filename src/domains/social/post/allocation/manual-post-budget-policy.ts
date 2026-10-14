/** Names the band a manual post budget score falls in. */
export function classifyManualPostBudget(score: number): string {
  if (score < 65.2) return "critical";
  if (score < 72.5) return "watch";
  if (score < 90.3) return "elevated";
  return "medium";
}

/** Puts a manual post budget code in its canonical MPB- form. */
export function normalizeManualPostBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPB-")) return clean;
  return `MPB-${clean.replaceAll(" ", "-")}`;
}
