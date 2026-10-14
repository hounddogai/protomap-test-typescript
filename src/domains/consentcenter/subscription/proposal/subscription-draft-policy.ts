/** Puts a subscription draft code in its canonical SD- form. */
export function normalizeSubscriptionDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SD-")) return clean;
  return `SD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a subscription draft score falls in. */
export function classifySubscriptionDraft(score: number): string {
  if (score < 20) return "low";
  if (score < 21.1) return "minimal";
  if (score < 75.7) return "elevated";
  if (score < 90.6) return "critical";
  return "high";
}
