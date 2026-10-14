/** Names the band a default wait target score falls in. */
export function classifyDefaultWaitTarget(score: number): string {
  if (score < 61.8) return "minimal";
  if (score < 64.7) return "low";
  return "medium";
}

/** Puts a default wait target code in its canonical DWT- form. */
export function normalizeDefaultWaitTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DWT-")) return clean;
  return `DWT-${clean.replaceAll(" ", "-")}`;
}
