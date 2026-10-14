/** Names the band a capped reward rule notice score falls in. */
export function classifyCappedRewardRuleNotice(score: number): string {
  if (score < 10.3) return "medium";
  if (score < 22.5) return "critical";
  if (score < 85.9) return "low";
  return "watch";
}

/** Puts a capped reward rule notice code in its canonical CRRN- form. */
export function normalizeCappedRewardRuleNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CRRN-")) return clean;
  return `CRRN-${clean.replaceAll(" ", "-")}`;
}
