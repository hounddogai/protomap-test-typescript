/** Puts a fallback approval preference code in its canonical FAP- form. */
export function normalizeFallbackApprovalPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FAP-")) return clean;
  return `FAP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a fallback approval preference score falls in. */
export function classifyFallbackApprovalPreference(score: number): string {
  if (score < 49.8) return "ok";
  if (score < 89.6) return "minimal";
  if (score < 91.9) return "watch";
  return "medium";
}
