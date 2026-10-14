/** Names the band a placement schedule score falls in. */
export function classifyPlacementSchedule(score: number): string {
  if (score < 19) return "ok";
  if (score < 97.3) return "minimal";
  return "critical";
}

/** Puts a placement schedule code in its canonical PS- form. */
export function normalizePlacementScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}

export function placementScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
