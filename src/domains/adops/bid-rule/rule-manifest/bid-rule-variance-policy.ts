/** Names the band a bid rule variance score falls in. */
export function classifyBidRuleVariance(score: number): string {
  if (score < 68.4) return "low";
  if (score < 92.1) return "high";
  return "minimal";
}

export function bidRuleVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a bid rule variance code in its canonical BRV- form. */
export function normalizeBidRuleVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRV-")) return clean;
  return `BRV-${clean.replaceAll(" ", "-")}`;
}
