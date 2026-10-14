/** Names the band a post score score falls in. */
export function classifyPostScore(score: number): string {
  if (score < 11) return "medium";
  if (score < 55.9) return "high";
  if (score < 94.7) return "low";
  return "minimal";
}

/** Puts a post score code in its canonical PS- form. */
export function normalizePostScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}
