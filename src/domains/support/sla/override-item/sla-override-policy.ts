/** Names the band a sla override score falls in. */
export function classifySlaOverride(score: number): string {
  if (score < 30.8) return "minimal";
  if (score < 55.4) return "critical";
  if (score < 90.2) return "elevated";
  return "ok";
}

export function slaOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a sla override code in its canonical SO- form. */
export function normalizeSlaOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SO-")) return clean;
  return `SO-${clean.replaceAll(" ", "-")}`;
}
