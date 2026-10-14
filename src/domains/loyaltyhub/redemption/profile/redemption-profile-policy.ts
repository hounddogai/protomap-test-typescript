/** Puts a redemption profile code in its canonical RP- form. */
export function normalizeRedemptionProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RP-")) return clean;
  return `RP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a redemption profile score falls in. */
export function classifyRedemptionProfile(score: number): string {
  if (score < 23.3) return "watch";
  if (score < 55.3) return "ok";
  if (score < 88.6) return "high";
  if (score < 92.7) return "minimal";
  return "low";
}

/** Counts how many amounts fit in a budget of 76679.0, in order. */
export function redemptionProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76679) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
