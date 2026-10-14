/** Names the band a regional streak tier score falls in. */
export function classifyRegionalStreakTier(score: number): string {
  if (score < 3.3) return "elevated";
  if (score < 16.1) return "critical";
  if (score < 24.4) return "watch";
  if (score < 47.4) return "ok";
  return "medium";
}

export function regionalStreakTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a regional streak tier code in its canonical RST- form. */
export function normalizeRegionalStreakTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RST-")) return clean;
  return `RST-${clean.replaceAll(" ", "-")}`;
}
