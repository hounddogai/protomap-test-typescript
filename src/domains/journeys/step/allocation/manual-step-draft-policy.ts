/** Names the band a manual step draft score falls in. */
export function classifyManualStepDraft(score: number): string {
  if (score < 18.6) return "low";
  if (score < 53.4) return "high";
  if (score < 81.6) return "medium";
  if (score < 94.9) return "critical";
  return "minimal";
}

/** Puts a manual step draft code in its canonical MSD- form. */
export function normalizeManualStepDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MSD-")) return clean;
  return `MSD-${clean.replaceAll(" ", "-")}`;
}
