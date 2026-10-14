/** Puts a primary insight profile code in its canonical PIP- form. */
export function normalizePrimaryInsightProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIP-")) return clean;
  return `PIP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary insight profile score falls in. */
export function classifyPrimaryInsightProfile(score: number): string {
  if (score < 97.3) return "minimal";
  if (score < 99.7) return "low";
  if (score < 99.9) return "critical";
  return "elevated";
}
