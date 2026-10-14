/** Names the band a weighted exit rule digest score falls in. */
export function classifyWeightedExitRuleDigest(score: number): string {
  if (score < 3.3) return "critical";
  if (score < 57.4) return "ok";
  if (score < 57.6) return "high";
  if (score < 73.9) return "minimal";
  return "low";
}

/** Counts how many amounts fit in a budget of 38768.0, in order. */
export function weightedExitRuleDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38768) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedExitRuleDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a weighted exit rule digest code in its canonical WERD- form. */
export function normalizeWeightedExitRuleDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WERD-")) return clean;
  return `WERD-${clean.replaceAll(" ", "-")}`;
}
