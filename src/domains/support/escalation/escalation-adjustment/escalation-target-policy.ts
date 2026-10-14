/** Puts a escalation target code in its canonical ET- form. */
export function normalizeEscalationTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ET-")) return clean;
  return `ET-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a escalation target score falls in. */
export function classifyEscalationTarget(score: number): string {
  if (score < 55.8) return "watch";
  if (score < 57.8) return "minimal";
  if (score < 58.5) return "low";
  if (score < 59.6) return "high";
  return "ok";
}
