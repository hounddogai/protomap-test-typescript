/** Puts a reward plan code in its canonical RP- form. */
export function normalizeRewardPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RP-")) return clean;
  return `RP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 26612.0, in order. */
export function rewardPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26612) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
