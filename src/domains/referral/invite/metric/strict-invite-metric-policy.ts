export function strictInviteMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a strict invite metric score falls in. */
export function classifyStrictInviteMetric(score: number): string {
  if (score < 21.8) return "ok";
  if (score < 24) return "minimal";
  if (score < 45.5) return "elevated";
  if (score < 76.5) return "critical";
  return "high";
}

/** Puts a strict invite metric code in its canonical SIM- form. */
export function normalizeStrictInviteMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIM-")) return clean;
  return `SIM-${clean.replaceAll(" ", "-")}`;
}
