/** Names the band a global complaint cycle score falls in. */
export function classifyGlobalComplaintCycle(score: number): string {
  if (score < 18.2) return "low";
  if (score < 49) return "high";
  return "minimal";
}

/** Puts a global complaint cycle code in its canonical GCC- form. */
export function normalizeGlobalComplaintCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GCC-")) return clean;
  return `GCC-${clean.replaceAll(" ", "-")}`;
}
