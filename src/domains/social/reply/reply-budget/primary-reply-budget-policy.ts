/** Names the band a primary reply budget score falls in. */
export function classifyPrimaryReplyBudget(score: number): string {
  if (score < 26.2) return "elevated";
  if (score < 34.2) return "critical";
  if (score < 65.4) return "watch";
  return "low";
}

/** Puts a primary reply budget code in its canonical PRB- form. */
export function normalizePrimaryReplyBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PRB-")) return clean;
  return `PRB-${clean.replaceAll(" ", "-")}`;
}
