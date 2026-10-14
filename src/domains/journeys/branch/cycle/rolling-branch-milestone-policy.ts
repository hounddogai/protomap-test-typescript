import * as numbers from "../../../../kit/numbers.js";

export function rollingBranchMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function rollingBranchMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 79182.0, in order. */
export function rollingBranchMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79182) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
