/** Puts a primary preference group code in its canonical PPG- form. */
export function normalizePrimaryPreferenceGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPG-")) return clean;
  return `PPG-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary preference group score falls in. */
export function classifyPrimaryPreferenceGroup(score: number): string {
  if (score < 4) return "high";
  if (score < 18.2) return "low";
  if (score < 74.8) return "medium";
  if (score < 96.4) return "elevated";
  return "watch";
}
