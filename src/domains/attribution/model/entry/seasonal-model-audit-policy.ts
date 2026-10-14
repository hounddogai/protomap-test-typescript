import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal model audit score falls in. */
export function classifySeasonalModelAudit(score: number): string {
  if (score < 41.5) return "watch";
  if (score < 58.5) return "low";
  if (score < 96.4) return "minimal";
  return "medium";
}

/** Counts how many amounts fit in a budget of 17645.0, in order. */
export function seasonalModelAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17645) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalModelAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function seasonalModelAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
