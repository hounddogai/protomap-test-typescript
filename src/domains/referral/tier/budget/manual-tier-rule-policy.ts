/** Names the band a manual tier rule score falls in. */
export function classifyManualTierRule(score: number): string {
  if (score < 8.6) return "low";
  if (score < 22) return "elevated";
  if (score < 23.8) return "watch";
  if (score < 74) return "critical";
  return "ok";
}

/** Puts a manual tier rule code in its canonical MTR- form. */
export function normalizeManualTierRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MTR-")) return clean;
  return `MTR-${clean.replaceAll(" ", "-")}`;
}
