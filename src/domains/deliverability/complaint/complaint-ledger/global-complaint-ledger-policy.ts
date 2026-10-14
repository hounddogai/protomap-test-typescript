import * as numbers from "../../../../kit/numbers.js";

export function globalComplaintLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 26782.0, in order. */
export function globalComplaintLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26782) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a global complaint ledger score falls in. */
export function classifyGlobalComplaintLedger(score: number): string {
  if (score < 34.2) return "watch";
  if (score < 40.9) return "low";
  if (score < 60.8) return "elevated";
  if (score < 70.1) return "high";
  return "ok";
}
