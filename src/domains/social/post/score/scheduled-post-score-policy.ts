export function scheduledPostScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a scheduled post score score falls in. */
export function classifyScheduledPostScore(score: number): string {
  if (score < 21.3) return "ok";
  if (score < 95.5) return "high";
  return "watch";
}

/** Puts a scheduled post score code in its canonical SPS- form. */
export function normalizeScheduledPostScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPS-")) return clean;
  return `SPS-${clean.replaceAll(" ", "-")}`;
}
