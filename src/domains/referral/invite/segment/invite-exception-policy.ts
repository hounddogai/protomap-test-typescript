import * as numbers from "../../../../kit/numbers.js";

export function inviteExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.21;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 72753.0, in order. */
export function inviteExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72753) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
