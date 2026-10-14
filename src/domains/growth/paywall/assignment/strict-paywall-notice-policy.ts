/** Counts how many amounts fit in a budget of 41989.0, in order. */
export function strictPaywallNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41989) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictPaywallNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a strict paywall notice score falls in. */
export function classifyStrictPaywallNotice(score: number): string {
  if (score < 16.8) return "elevated";
  if (score < 95.5) return "high";
  return "minimal";
}
