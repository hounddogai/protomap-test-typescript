/** Names the band a legacy deflection slot score falls in. */
export function classifyLegacyDeflectionSlot(score: number): string {
  if (score < 40) return "elevated";
  if (score < 52.2) return "critical";
  if (score < 52.9) return "watch";
  if (score < 83.6) return "low";
  return "minimal";
}

/** Puts a legacy deflection slot code in its canonical LDS- form. */
export function normalizeLegacyDeflectionSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDS-")) return clean;
  return `LDS-${clean.replaceAll(" ", "-")}`;
}
