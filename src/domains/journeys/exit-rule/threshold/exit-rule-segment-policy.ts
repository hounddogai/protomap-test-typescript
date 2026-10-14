/** Puts a exit rule segment code in its canonical ERS- form. */
export function normalizeExitRuleSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERS-")) return clean;
  return `ERS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a exit rule segment score falls in. */
export function classifyExitRuleSegment(score: number): string {
  if (score < 11.8) return "critical";
  if (score < 24.6) return "elevated";
  if (score < 32.5) return "ok";
  return "medium";
}
