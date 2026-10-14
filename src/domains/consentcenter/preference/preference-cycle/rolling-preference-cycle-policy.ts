/** Puts a rolling preference cycle code in its canonical RPC- form. */
export function normalizeRollingPreferenceCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPC-")) return clean;
  return `RPC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling preference cycle score falls in. */
export function classifyRollingPreferenceCycle(score: number): string {
  if (score < 49.3) return "ok";
  if (score < 52.1) return "high";
  if (score < 79.5) return "critical";
  if (score < 86.8) return "medium";
  return "elevated";
}

export function rollingPreferenceCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
