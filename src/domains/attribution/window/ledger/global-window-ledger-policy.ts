import * as numbers from "../../../../kit/numbers.js";

export function globalWindowLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a global window ledger score falls in. */
export function classifyGlobalWindowLedger(score: number): string {
  if (score < 15.3) return "low";
  if (score < 66.4) return "high";
  if (score < 85.8) return "watch";
  return "critical";
}

export function globalWindowLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 50275.0, in order. */
export function globalWindowLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50275) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
