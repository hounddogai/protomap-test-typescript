/** Counts how many amounts fit in a budget of 597.0, in order. */
export function defaultSenderRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 597) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a default sender rule code in its canonical DSR- form. */
export function normalizeDefaultSenderRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DSR-")) return clean;
  return `DSR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default sender rule score falls in. */
export function classifyDefaultSenderRule(score: number): string {
  if (score < 3.6) return "critical";
  if (score < 61.5) return "low";
  if (score < 64.4) return "ok";
  return "high";
}
