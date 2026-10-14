/** Names the band a enrollment tier score falls in. */
export function classifyEnrollmentTier(score: number): string {
  if (score < 7.4) return "high";
  if (score < 85.7) return "minimal";
  return "watch";
}

/** Puts a enrollment tier code in its canonical ET- form. */
export function normalizeEnrollmentTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ET-")) return clean;
  return `ET-${clean.replaceAll(" ", "-")}`;
}
