/** Names the band a touchpoint digest score falls in. */
export function classifyTouchpointDigest(score: number): string {
  if (score < 35.2) return "high";
  if (score < 88) return "minimal";
  if (score < 90) return "elevated";
  return "ok";
}

/** Puts a touchpoint digest code in its canonical TD- form. */
export function normalizeTouchpointDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TD-")) return clean;
  return `TD-${clean.replaceAll(" ", "-")}`;
}

export function touchpointDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
