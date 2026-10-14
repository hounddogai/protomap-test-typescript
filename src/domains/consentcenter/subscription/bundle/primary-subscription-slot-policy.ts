/** Counts how many amounts fit in a budget of 59069.0, in order. */
export function primarySubscriptionSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59069) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primarySubscriptionSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a primary subscription slot score falls in. */
export function classifyPrimarySubscriptionSlot(score: number): string {
  if (score < 49.1) return "low";
  if (score < 63.1) return "medium";
  if (score < 75.5) return "high";
  return "elevated";
}
