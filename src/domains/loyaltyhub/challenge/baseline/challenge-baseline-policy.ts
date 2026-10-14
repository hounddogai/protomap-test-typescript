/** Puts a challenge baseline code in its canonical CB- form. */
export function normalizeChallengeBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CB-")) return clean;
  return `CB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a challenge baseline score falls in. */
export function classifyChallengeBaseline(score: number): string {
  if (score < 31.6) return "high";
  if (score < 68.8) return "elevated";
  return "medium";
}
