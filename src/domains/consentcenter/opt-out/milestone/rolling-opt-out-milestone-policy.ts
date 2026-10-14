/** Names the band a rolling opt out milestone score falls in. */
export function classifyRollingOptOutMilestone(score: number): string {
  if (score < 42.8) return "high";
  if (score < 45.6) return "minimal";
  return "ok";
}

/** Puts a rolling opt out milestone code in its canonical ROOM- form. */
export function normalizeRollingOptOutMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ROOM-")) return clean;
  return `ROOM-${clean.replaceAll(" ", "-")}`;
}
