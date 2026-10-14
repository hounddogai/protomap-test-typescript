import * as numbers from "../../../../kit/numbers.js";

export function defaultPaywallBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 87876.0, in order. */
export function defaultPaywallBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87876) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
