/** Puts a lenient opt out adjustment code in its canonical LOOA- form. */
export function normalizeLenientOptOutAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LOOA-")) return clean;
  return `LOOA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient opt out adjustment score falls in. */
export function classifyLenientOptOutAdjustment(score: number): string {
  if (score < 3.1) return "medium";
  if (score < 42.3) return "minimal";
  if (score < 49.6) return "low";
  if (score < 59.8) return "elevated";
  return "high";
}
