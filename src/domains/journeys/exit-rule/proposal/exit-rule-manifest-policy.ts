/** Names the band a exit rule manifest score falls in. */
export function classifyExitRuleManifest(score: number): string {
  if (score < 22.4) return "watch";
  if (score < 31.6) return "high";
  return "ok";
}

/** Puts a exit rule manifest code in its canonical ERM- form. */
export function normalizeExitRuleManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERM-")) return clean;
  return `ERM-${clean.replaceAll(" ", "-")}`;
}
