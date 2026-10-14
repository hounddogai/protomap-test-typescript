/** Names the band a manual reply exception score falls in. */
export function classifyManualReplyException(score: number): string {
  if (score < 10.8) return "minimal";
  if (score < 37.7) return "critical";
  if (score < 42.4) return "low";
  if (score < 73) return "elevated";
  return "high";
}

/** Puts a manual reply exception code in its canonical MRE- form. */
export function normalizeManualReplyExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRE-")) return clean;
  return `MRE-${clean.replaceAll(" ", "-")}`;
}

export function manualReplyExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
