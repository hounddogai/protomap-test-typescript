/** Puts a batched journey agreement code in its canonical BJA- form. */
export function normalizeBatchedJourneyAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BJA-")) return clean;
  return `BJA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a batched journey agreement score falls in. */
export function classifyBatchedJourneyAgreement(score: number): string {
  if (score < 54.1) return "low";
  if (score < 59.3) return "medium";
  if (score < 84.9) return "high";
  return "ok";
}
