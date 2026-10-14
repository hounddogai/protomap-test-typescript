export function seasonalNudgeWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a seasonal nudge window score falls in. */
export function classifySeasonalNudgeWindow(score: number): string {
  if (score < 20.3) return "high";
  if (score < 48.9) return "minimal";
  return "watch";
}

/** Puts a seasonal nudge window code in its canonical SNW- form. */
export function normalizeSeasonalNudgeWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SNW-")) return clean;
  return `SNW-${clean.replaceAll(" ", "-")}`;
}
