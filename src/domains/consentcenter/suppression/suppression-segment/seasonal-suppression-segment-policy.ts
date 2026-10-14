/** Names the band a seasonal suppression segment score falls in. */
export function classifySeasonalSuppressionSegment(score: number): string {
  if (score < 28.6) return "medium";
  if (score < 63.8) return "watch";
  if (score < 71.4) return "low";
  return "ok";
}

/** Puts a seasonal suppression segment code in its canonical SSS- form. */
export function normalizeSeasonalSuppressionSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSS-")) return clean;
  return `SSS-${clean.replaceAll(" ", "-")}`;
}

export function seasonalSuppressionSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
