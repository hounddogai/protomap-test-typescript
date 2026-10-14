import * as numbers from "../../../../kit/numbers.js";

export function regionalTicketViewLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 60418.0, in order. */
export function regionalTicketViewLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60418) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional ticket view ledger score falls in. */
export function classifyRegionalTicketViewLedger(score: number): string {
  if (score < 11.1) return "elevated";
  if (score < 59.5) return "low";
  if (score < 77.8) return "medium";
  if (score < 84.6) return "minimal";
  return "high";
}
