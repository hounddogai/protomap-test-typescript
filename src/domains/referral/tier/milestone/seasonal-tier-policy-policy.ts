export function seasonalTierPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a seasonal tier policy code in its canonical STP- form. */
export function normalizeSeasonalTierPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STP-")) return clean;
  return `STP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal tier policy score falls in. */
export function classifySeasonalTierPolicy(score: number): string {
  if (score < 66.9) return "elevated";
  if (score < 84.2) return "medium";
  return "minimal";
}
