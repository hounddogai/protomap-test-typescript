/** Puts a strict payout assignment code in its canonical SPA- form. */
export function normalizeStrictPayoutAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPA-")) return clean;
  return `SPA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict payout assignment score falls in. */
export function classifyStrictPayoutAssignment(score: number): string {
  if (score < 32.2) return "low";
  if (score < 73.3) return "minimal";
  return "elevated";
}
