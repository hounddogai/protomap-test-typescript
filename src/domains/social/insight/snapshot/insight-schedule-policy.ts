/** Puts a insight schedule code in its canonical IS- form. */
export function normalizeInsightScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IS-")) return clean;
  return `IS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a insight schedule score falls in. */
export function classifyInsightSchedule(score: number): string {
  if (score < 33.2) return "watch";
  if (score < 73.2) return "elevated";
  if (score < 80) return "critical";
  if (score < 85.3) return "low";
  return "ok";
}
