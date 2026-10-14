/** Puts a weighted preference baseline code in its canonical WPB- form. */
export function normalizeWeightedPreferenceBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPB-")) return clean;
  return `WPB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted preference baseline score falls in. */
export function classifyWeightedPreferenceBaseline(score: number): string {
  if (score < 11.9) return "medium";
  if (score < 81.1) return "high";
  return "minimal";
}
