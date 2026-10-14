/** Names the band a bounce mapping score falls in. */
export function classifyBounceMapping(score: number): string {
  if (score < 3.6) return "critical";
  if (score < 73.7) return "high";
  if (score < 86.9) return "minimal";
  return "low";
}

/** Puts a bounce mapping code in its canonical BM- form. */
export function normalizeBounceMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BM-")) return clean;
  return `BM-${clean.replaceAll(" ", "-")}`;
}
