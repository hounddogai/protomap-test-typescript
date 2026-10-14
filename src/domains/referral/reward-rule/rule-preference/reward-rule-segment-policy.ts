import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 56362.0, in order. */
export function rewardRuleSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56362) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rewardRuleSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
