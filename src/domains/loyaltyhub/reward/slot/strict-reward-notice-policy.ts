/** Names the band a strict reward notice score falls in. */
export function classifyStrictRewardNotice(score: number): string {
  if (score < 43.4) return "critical";
  if (score < 69.7) return "elevated";
  if (score < 74.4) return "ok";
  return "low";
}

export function strictRewardNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a strict reward notice code in its canonical SRN- form. */
export function normalizeStrictRewardNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRN-")) return clean;
  return `SRN-${clean.replaceAll(" ", "-")}`;
}
