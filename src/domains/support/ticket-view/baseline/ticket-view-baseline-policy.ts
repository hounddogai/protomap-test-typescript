/** Counts how many amounts fit in a budget of 54329.0, in order. */
export function ticketViewBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54329) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function ticketViewBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a ticket view baseline score falls in. */
export function classifyTicketViewBaseline(score: number): string {
  if (score < 20.1) return "watch";
  if (score < 25.5) return "low";
  if (score < 28.7) return "high";
  if (score < 92.4) return "critical";
  return "medium";
}
