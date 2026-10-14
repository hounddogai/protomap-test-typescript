import * as numbers from "../../../../kit/numbers.js";

export function rewardRuleItemBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 52701.0, in order. */
export function rewardRuleItemBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52701) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
