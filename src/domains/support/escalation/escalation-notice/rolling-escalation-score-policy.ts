/** Names the band a rolling escalation score score falls in. */
export function classifyRollingEscalationScore(score: number): string {
  if (score < 40.3) return "ok";
  if (score < 55.8) return "minimal";
  return "elevated";
}

/** Puts a rolling escalation score code in its canonical RES- form. */
export function normalizeRollingEscalationScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RES-")) return clean;
  return `RES-${clean.replaceAll(" ", "-")}`;
}
