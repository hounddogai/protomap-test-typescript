/** Puts a reward target code in its canonical RT- form. */
export function normalizeRewardTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RT-")) return clean;
  return `RT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a reward target score falls in. */
export function classifyRewardTarget(score: number): string {
  if (score < 8.2) return "low";
  if (score < 37.9) return "watch";
  if (score < 40) return "critical";
  if (score < 98.4) return "ok";
  return "high";
}
