/** Puts a adaptive insight target code in its canonical AIT- form. */
export function normalizeAdaptiveInsightTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AIT-")) return clean;
  return `AIT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a adaptive insight target score falls in. */
export function classifyAdaptiveInsightTarget(score: number): string {
  if (score < 54.1) return "medium";
  if (score < 70.1) return "high";
  return "low";
}
