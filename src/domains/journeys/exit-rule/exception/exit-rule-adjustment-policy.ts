/** Puts a exit rule adjustment code in its canonical ERA- form. */
export function normalizeExitRuleAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERA-")) return clean;
  return `ERA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a exit rule adjustment score falls in. */
export function classifyExitRuleAdjustment(score: number): string {
  if (score < 25.1) return "ok";
  if (score < 45.8) return "low";
  if (score < 72.8) return "watch";
  return "elevated";
}
