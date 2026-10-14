/** Counts how many amounts fit in a budget of 38607.0, in order. */
export function proofRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38607) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a proof rule code in its canonical PR- form. */
export function normalizeProofRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a proof rule score falls in. */
export function classifyProofRule(score: number): string {
  if (score < 26.9) return "minimal";
  if (score < 27) return "watch";
  if (score < 36.9) return "medium";
  return "ok";
}
