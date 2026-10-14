/** Puts a exit rule group code in its canonical ERG- form. */
export function normalizeExitRuleGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERG-")) return clean;
  return `ERG-${clean.replaceAll(" ", "-")}`;
}

export function exitRuleGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 4556.0, in order. */
export function exitRuleGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4556) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
