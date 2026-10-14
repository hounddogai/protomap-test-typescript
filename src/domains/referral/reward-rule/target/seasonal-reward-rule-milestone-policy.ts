import * as numbers from "../../../../kit/numbers.js";

export function seasonalRewardRuleMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function seasonalRewardRuleMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 7234.0, in order. */
export function seasonalRewardRuleMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7234) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
