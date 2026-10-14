/** Puts a capped challenge claim code in its canonical CCC- form. */
export function normalizeCappedChallengeClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CCC-")) return clean;
  return `CCC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a capped challenge claim score falls in. */
export function classifyCappedChallengeClaim(score: number): string {
  if (score < 28) return "medium";
  if (score < 72.8) return "critical";
  return "low";
}
