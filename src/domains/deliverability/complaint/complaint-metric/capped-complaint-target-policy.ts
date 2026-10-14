/** Puts a capped complaint target code in its canonical CCT- form. */
export function normalizeCappedComplaintTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CCT-")) return clean;
  return `CCT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 24338.0, in order. */
export function cappedComplaintTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24338) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped complaint target score falls in. */
export function classifyCappedComplaintTarget(score: number): string {
  if (score < 7.3) return "ok";
  if (score < 13.7) return "low";
  return "watch";
}
