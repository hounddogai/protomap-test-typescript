/** Puts a default challenge slot code in its canonical DCS- form. */
export function normalizeDefaultChallengeSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCS-")) return clean;
  return `DCS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default challenge slot score falls in. */
export function classifyDefaultChallengeSlot(score: number): string {
  if (score < 11.3) return "medium";
  if (score < 18.2) return "ok";
  if (score < 38.2) return "minimal";
  return "low";
}
