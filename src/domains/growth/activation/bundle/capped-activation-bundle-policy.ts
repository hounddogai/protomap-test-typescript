export function cappedActivationBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Puts a capped activation bundle code in its canonical CAB- form. */
export function normalizeCappedActivationBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CAB-")) return clean;
  return `CAB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a capped activation bundle score falls in. */
export function classifyCappedActivationBundle(score: number): string {
  if (score < 2.5) return "critical";
  if (score < 10.6) return "ok";
  if (score < 67.2) return "minimal";
  if (score < 91.6) return "low";
  return "high";
}
