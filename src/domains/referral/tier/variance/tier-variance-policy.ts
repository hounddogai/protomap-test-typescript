/** Names the band a tier variance score falls in. */
export function classifyTierVariance(score: number): string {
  if (score < 36.3) return "ok";
  if (score < 58.6) return "minimal";
  if (score < 71.4) return "watch";
  if (score < 92.6) return "high";
  return "medium";
}

/** Puts a tier variance code in its canonical TV- form. */
export function normalizeTierVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TV-")) return clean;
  return `TV-${clean.replaceAll(" ", "-")}`;
}

export function tierVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
