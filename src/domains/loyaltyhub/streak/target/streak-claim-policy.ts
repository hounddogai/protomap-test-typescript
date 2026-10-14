export function streakClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a streak claim code in its canonical SC- form. */
export function normalizeStreakClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SC-")) return clean;
  return `SC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a streak claim score falls in. */
export function classifyStreakClaim(score: number): string {
  if (score < 29.3) return "elevated";
  if (score < 36) return "ok";
  if (score < 51.8) return "medium";
  return "low";
}
