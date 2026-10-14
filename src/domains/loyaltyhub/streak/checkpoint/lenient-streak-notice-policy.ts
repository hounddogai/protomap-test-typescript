/** Puts a lenient streak notice code in its canonical LSN- form. */
export function normalizeLenientStreakNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSN-")) return clean;
  return `LSN-${clean.replaceAll(" ", "-")}`;
}

export function lenientStreakNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a lenient streak notice score falls in. */
export function classifyLenientStreakNotice(score: number): string {
  if (score < 5.5) return "elevated";
  if (score < 36.3) return "high";
  if (score < 65.7) return "critical";
  if (score < 97.2) return "medium";
  return "ok";
}
