/** Names the band a complaint schedule score falls in. */
export function classifyComplaintSchedule(score: number): string {
  if (score < 24.5) return "low";
  if (score < 60.2) return "high";
  return "watch";
}

/** Puts a complaint schedule code in its canonical CS- form. */
export function normalizeComplaintScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CS-")) return clean;
  return `CS-${clean.replaceAll(" ", "-")}`;
}
