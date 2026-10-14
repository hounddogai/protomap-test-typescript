/** Puts a fallback bid rule window code in its canonical FBRW- form. */
export function normalizeFallbackBidRuleWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FBRW-")) return clean;
  return `FBRW-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a fallback bid rule window score falls in. */
export function classifyFallbackBidRuleWindow(score: number): string {
  if (score < 3.8) return "low";
  if (score < 3.8) return "elevated";
  if (score < 39.5) return "watch";
  if (score < 91.7) return "ok";
  return "minimal";
}
