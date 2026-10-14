/** Puts a reward rule allocation code in its canonical RRA- form. */
export function normalizeRewardRuleAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRA-")) return clean;
  return `RRA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a reward rule allocation score falls in. */
export function classifyRewardRuleAllocation(score: number): string {
  if (score < 58.5) return "low";
  if (score < 78.5) return "watch";
  return "elevated";
}
