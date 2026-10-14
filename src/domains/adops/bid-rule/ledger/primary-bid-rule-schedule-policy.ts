/** Names the band a primary bid rule schedule score falls in. */
export function classifyPrimaryBidRuleSchedule(score: number): string {
  if (score < 55.4) return "medium";
  if (score < 78.1) return "elevated";
  if (score < 84.2) return "low";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 64843.0, in order. */
export function primaryBidRuleScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64843) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary bid rule schedule code in its canonical PBRS- form. */
export function normalizePrimaryBidRuleScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PBRS-")) return clean;
  return `PBRS-${clean.replaceAll(" ", "-")}`;
}
