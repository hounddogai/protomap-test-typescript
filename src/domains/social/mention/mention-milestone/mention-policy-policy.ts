/** Names the band a mention policy score falls in. */
export function classifyMentionPolicy(score: number): string {
  if (score < 43.4) return "medium";
  if (score < 50.2) return "critical";
  if (score < 83.5) return "ok";
  return "watch";
}

export function mentionPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 74911.0, in order. */
export function mentionPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74911) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
