/** Names the band a rolling placement notice score falls in. */
export function classifyRollingPlacementNotice(score: number): string {
  if (score < 30.1) return "critical";
  if (score < 48.2) return "minimal";
  if (score < 55.6) return "high";
  if (score < 65.8) return "elevated";
  return "watch";
}

/** Counts how many amounts fit in a budget of 26985.0, in order. */
export function rollingPlacementNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26985) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingPlacementNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
