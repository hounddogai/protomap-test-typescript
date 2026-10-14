/** Puts a weighted post override code in its canonical WPO- form. */
export function normalizeWeightedPostOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPO-")) return clean;
  return `WPO-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted post override score falls in. */
export function classifyWeightedPostOverride(score: number): string {
  if (score < 13.9) return "minimal";
  if (score < 82.1) return "low";
  if (score < 90.4) return "critical";
  return "ok";
}
