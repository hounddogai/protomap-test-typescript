/** Puts a window preference code in its canonical WP- form. */
export function normalizeWindowPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WP-")) return clean;
  return `WP-${clean.replaceAll(" ", "-")}`;
}

export function windowPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a window preference score falls in. */
export function classifyWindowPreference(score: number): string {
  if (score < 16.5) return "ok";
  if (score < 27.3) return "critical";
  if (score < 90.9) return "watch";
  if (score < 92) return "medium";
  return "low";
}
