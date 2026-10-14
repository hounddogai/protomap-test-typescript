import * as numbers from "../../../../kit/numbers.js";

export function paywallLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 56911.0, in order. */
export function paywallLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56911) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
