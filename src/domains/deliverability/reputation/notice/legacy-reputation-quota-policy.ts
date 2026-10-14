/** Puts a legacy reputation quota code in its canonical LRQ- form. */
export function normalizeLegacyReputationQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRQ-")) return clean;
  return `LRQ-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy reputation quota score falls in. */
export function classifyLegacyReputationQuota(score: number): string {
  if (score < 3.4) return "minimal";
  if (score < 26.7) return "medium";
  if (score < 80.1) return "ok";
  if (score < 93.4) return "high";
  return "watch";
}
