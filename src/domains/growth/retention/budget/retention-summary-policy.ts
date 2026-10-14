import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 32615.0, in order. */
export function retentionSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32615) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function retentionSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function retentionSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
