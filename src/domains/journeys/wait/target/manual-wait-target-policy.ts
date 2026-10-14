/** Puts a manual wait target code in its canonical MWT- form. */
export function normalizeManualWaitTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MWT-")) return clean;
  return `MWT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a manual wait target score falls in. */
export function classifyManualWaitTarget(score: number): string {
  if (score < 61.7) return "low";
  if (score < 94.6) return "ok";
  return "medium";
}
