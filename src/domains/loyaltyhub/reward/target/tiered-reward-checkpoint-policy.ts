/** Names the band a tiered reward checkpoint score falls in. */
export function classifyTieredRewardCheckpoint(score: number): string {
  if (score < 67.3) return "critical";
  if (score < 70.2) return "watch";
  if (score < 88.4) return "ok";
  return "minimal";
}

/** Puts a tiered reward checkpoint code in its canonical TRC- form. */
export function normalizeTieredRewardCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRC-")) return clean;
  return `TRC-${clean.replaceAll(" ", "-")}`;
}
