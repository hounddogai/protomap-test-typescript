export function weightedMentionExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a weighted mention exception code in its canonical WME- form. */
export function normalizeWeightedMentionExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WME-")) return clean;
  return `WME-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted mention exception score falls in. */
export function classifyWeightedMentionException(score: number): string {
  if (score < 33.9) return "elevated";
  if (score < 37.5) return "ok";
  if (score < 56.5) return "minimal";
  if (score < 60.8) return "low";
  return "medium";
}
