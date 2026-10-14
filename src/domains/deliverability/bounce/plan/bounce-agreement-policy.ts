/** Puts a bounce agreement code in its canonical BA- form. */
export function normalizeBounceAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BA-")) return clean;
  return `BA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a bounce agreement score falls in. */
export function classifyBounceAgreement(score: number): string {
  if (score < 61.9) return "low";
  if (score < 62.1) return "critical";
  return "high";
}
