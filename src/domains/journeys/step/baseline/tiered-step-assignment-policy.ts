import * as numbers from "../../../../kit/numbers.js";

export function tieredStepAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function tieredStepAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 94168.0, in order. */
export function tieredStepAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94168) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
