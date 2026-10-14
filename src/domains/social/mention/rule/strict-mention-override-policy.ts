/** Names the band a strict mention override score falls in. */
export function classifyStrictMentionOverride(score: number): string {
  if (score < 48.1) return "critical";
  if (score < 59.1) return "high";
  if (score < 74.9) return "low";
  if (score < 75.6) return "watch";
  return "minimal";
}

/** Puts a strict mention override code in its canonical SMO- form. */
export function normalizeStrictMentionOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMO-")) return clean;
  return `SMO-${clean.replaceAll(" ", "-")}`;
}
