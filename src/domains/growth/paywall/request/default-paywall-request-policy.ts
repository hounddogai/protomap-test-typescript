/** Names the band a default paywall request score falls in. */
export function classifyDefaultPaywallRequest(score: number): string {
  if (score < 15.6) return "elevated";
  if (score < 60.4) return "minimal";
  if (score < 60.9) return "critical";
  return "low";
}

/** Puts a default paywall request code in its canonical DPR- form. */
export function normalizeDefaultPaywallRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPR-")) return clean;
  return `DPR-${clean.replaceAll(" ", "-")}`;
}

export function defaultPaywallRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
