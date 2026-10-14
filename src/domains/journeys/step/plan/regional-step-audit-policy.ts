/** Names the band a regional step audit score falls in. */
export function classifyRegionalStepAudit(score: number): string {
  if (score < 26.1) return "high";
  if (score < 40.2) return "elevated";
  if (score < 74.6) return "minimal";
  if (score < 97.5) return "critical";
  return "low";
}

/** Puts a regional step audit code in its canonical RSA- form. */
export function normalizeRegionalStepAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSA-")) return clean;
  return `RSA-${clean.replaceAll(" ", "-")}`;
}
