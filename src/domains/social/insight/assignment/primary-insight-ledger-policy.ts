import * as numbers from "../../../../kit/numbers.js";

export function primaryInsightLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 26473.0, in order. */
export function primaryInsightLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26473) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary insight ledger score falls in. */
export function classifyPrimaryInsightLedger(score: number): string {
  if (score < 6.7) return "ok";
  if (score < 79.1) return "minimal";
  return "critical";
}

export function primaryInsightLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
