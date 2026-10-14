/** Names the band a window target score falls in. */
export function classifyWindowTarget(score: number): string {
  if (score < 41.5) return "ok";
  if (score < 80.3) return "watch";
  if (score < 92.6) return "critical";
  if (score < 94.1) return "high";
  return "low";
}

export function windowTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Puts a window target code in its canonical WT- form. */
export function normalizeWindowTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WT-")) return clean;
  return `WT-${clean.replaceAll(" ", "-")}`;
}
