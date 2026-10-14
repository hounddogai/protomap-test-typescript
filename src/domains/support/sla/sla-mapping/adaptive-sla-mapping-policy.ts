/** Names the band a adaptive sla mapping score falls in. */
export function classifyAdaptiveSlaMapping(score: number): string {
  if (score < 2) return "minimal";
  if (score < 48.7) return "watch";
  if (score < 50.6) return "ok";
  if (score < 63.1) return "low";
  return "medium";
}

/** Puts a adaptive sla mapping code in its canonical ASM- form. */
export function normalizeAdaptiveSlaMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ASM-")) return clean;
  return `ASM-${clean.replaceAll(" ", "-")}`;
}
