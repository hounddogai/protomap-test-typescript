/** Names the band a weighted payout budget score falls in. */
export function classifyWeightedPayoutBudget(score: number): string {
  if (score < 3.3) return "minimal";
  if (score < 36.7) return "critical";
  if (score < 58.8) return "elevated";
  return "ok";
}

/** Puts a weighted payout budget code in its canonical WPB- form. */
export function normalizeWeightedPayoutBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPB-")) return clean;
  return `WPB-${clean.replaceAll(" ", "-")}`;
}
