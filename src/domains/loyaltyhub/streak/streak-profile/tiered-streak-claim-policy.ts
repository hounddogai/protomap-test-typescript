/** Puts a tiered streak claim code in its canonical TSC- form. */
export function normalizeTieredStreakClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TSC-")) return clean;
  return `TSC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a tiered streak claim score falls in. */
export function classifyTieredStreakClaim(score: number): string {
  if (score < 1.9) return "critical";
  if (score < 4) return "watch";
  return "high";
}
