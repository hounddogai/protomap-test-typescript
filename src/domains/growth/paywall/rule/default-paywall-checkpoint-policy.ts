/** Names the band a default paywall checkpoint score falls in. */
export function classifyDefaultPaywallCheckpoint(score: number): string {
  if (score < 4.6) return "watch";
  if (score < 8.1) return "critical";
  if (score < 52.2) return "low";
  if (score < 90.8) return "medium";
  return "minimal";
}

/** Puts a default paywall checkpoint code in its canonical DPC- form. */
export function normalizeDefaultPaywallCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPC-")) return clean;
  return `DPC-${clean.replaceAll(" ", "-")}`;
}
