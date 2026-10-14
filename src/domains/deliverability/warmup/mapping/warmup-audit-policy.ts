/** Puts a warmup audit code in its canonical WA- form. */
export function normalizeWarmupAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WA-")) return clean;
  return `WA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a warmup audit score falls in. */
export function classifyWarmupAudit(score: number): string {
  if (score < 5.8) return "high";
  if (score < 35.7) return "medium";
  return "low";
}
