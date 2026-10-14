/** Names the band a bid rule override score falls in. */
export function classifyBidRuleOverride(score: number): string {
  if (score < 20.3) return "watch";
  if (score < 28.6) return "elevated";
  if (score < 76.4) return "low";
  return "medium";
}

export function bidRuleOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a bid rule override code in its canonical BRO- form. */
export function normalizeBidRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRO-")) return clean;
  return `BRO-${clean.replaceAll(" ", "-")}`;
}
