/** Names the band a legacy activation exception score falls in. */
export function classifyLegacyActivationException(score: number): string {
  if (score < 3.6) return "critical";
  if (score < 55.9) return "watch";
  if (score < 83.7) return "high";
  if (score < 88.7) return "minimal";
  return "medium";
}

/** Puts a legacy activation exception code in its canonical LAE- form. */
export function normalizeLegacyActivationExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LAE-")) return clean;
  return `LAE-${clean.replaceAll(" ", "-")}`;
}
