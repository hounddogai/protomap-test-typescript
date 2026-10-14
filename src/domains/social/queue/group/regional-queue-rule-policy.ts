import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 14918.0, in order. */
export function regionalQueueRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14918) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function regionalQueueRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
