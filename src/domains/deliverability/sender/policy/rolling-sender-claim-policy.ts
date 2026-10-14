/** Puts a rolling sender claim code in its canonical RSC- form. */
export function normalizeRollingSenderClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSC-")) return clean;
  return `RSC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling sender claim score falls in. */
export function classifyRollingSenderClaim(score: number): string {
  if (score < 24.9) return "high";
  if (score < 42.4) return "elevated";
  return "minimal";
}
