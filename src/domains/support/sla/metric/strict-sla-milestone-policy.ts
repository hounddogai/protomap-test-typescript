/** Names the band a strict sla milestone score falls in. */
export function classifyStrictSlaMilestone(score: number): string {
  if (score < 3.8) return "medium";
  if (score < 13.7) return "low";
  if (score < 62.4) return "critical";
  if (score < 67) return "elevated";
  return "ok";
}

/** Puts a strict sla milestone code in its canonical SSM- form. */
export function normalizeStrictSlaMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSM-")) return clean;
  return `SSM-${clean.replaceAll(" ", "-")}`;
}
