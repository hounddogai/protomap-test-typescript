/** Names the band a strict exit rule cycle score falls in. */
export function classifyStrictExitRuleCycle(score: number): string {
  if (score < 43.3) return "elevated";
  if (score < 48.3) return "ok";
  if (score < 73.6) return "watch";
  if (score < 83.5) return "medium";
  return "critical";
}

/** Counts how many amounts fit in a budget of 73861.0, in order. */
export function strictExitRuleCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73861) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictExitRuleCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
