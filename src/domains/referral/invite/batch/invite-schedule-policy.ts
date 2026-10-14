/** Names the band a invite schedule score falls in. */
export function classifyInviteSchedule(score: number): string {
  if (score < 5.8) return "critical";
  if (score < 8.1) return "medium";
  if (score < 24.1) return "elevated";
  if (score < 27.1) return "ok";
  return "high";
}

export function inviteScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a invite schedule code in its canonical IS- form. */
export function normalizeInviteScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IS-")) return clean;
  return `IS-${clean.replaceAll(" ", "-")}`;
}
