/** Names the band a frequency metric score falls in. */
export function classifyFrequencyMetric(score: number): string {
  if (score < 72.1) return "medium";
  if (score < 98.6) return "watch";
  return "high";
}

/** Puts a frequency metric code in its canonical FM- form. */
export function normalizeFrequencyMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FM-")) return clean;
  return `FM-${clean.replaceAll(" ", "-")}`;
}
