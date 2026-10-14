export function rewardPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a reward policy code in its canonical RP- form. */
export function normalizeRewardPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RP-")) return clean;
  return `RP-${clean.replaceAll(" ", "-")}`;
}
