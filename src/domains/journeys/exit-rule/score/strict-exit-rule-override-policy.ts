/** Puts a strict exit rule override code in its canonical SERO- form. */
export function normalizeStrictExitRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SERO-")) return clean;
  return `SERO-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict exit rule override score falls in. */
export function classifyStrictExitRuleOverride(score: number): string {
  if (score < 13.5) return "high";
  if (score < 19.9) return "critical";
  if (score < 40) return "medium";
  if (score < 72.2) return "minimal";
  return "low";
}

export function strictExitRuleOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
