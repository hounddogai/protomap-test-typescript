export function lenientCreditPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a lenient credit preference score falls in. */
export function classifyLenientCreditPreference(score: number): string {
  if (score < 17.8) return "medium";
  if (score < 33.3) return "watch";
  if (score < 82.8) return "critical";
  if (score < 99.2) return "low";
  return "high";
}

/** Puts a lenient credit preference code in its canonical LCP- form. */
export function normalizeLenientCreditPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCP-")) return clean;
  return `LCP-${clean.replaceAll(" ", "-")}`;
}
