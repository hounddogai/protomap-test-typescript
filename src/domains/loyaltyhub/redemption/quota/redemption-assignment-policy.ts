/** Puts a redemption assignment code in its canonical RA- form. */
export function normalizeRedemptionAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RA-")) return clean;
  return `RA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 39071.0, in order. */
export function redemptionAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39071) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a redemption assignment score falls in. */
export function classifyRedemptionAssignment(score: number): string {
  if (score < 11.6) return "high";
  if (score < 58.5) return "ok";
  return "minimal";
}
