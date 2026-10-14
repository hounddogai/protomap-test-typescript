/** Puts a global sla digest code in its canonical GSD- form. */
export function normalizeGlobalSlaDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSD-")) return clean;
  return `GSD-${clean.replaceAll(" ", "-")}`;
}

export function globalSlaDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a global sla digest score falls in. */
export function classifyGlobalSlaDigest(score: number): string {
  if (score < 63.9) return "critical";
  if (score < 84.5) return "minimal";
  return "watch";
}
