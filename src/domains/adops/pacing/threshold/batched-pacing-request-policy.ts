import * as numbers from "../../../../kit/numbers.js";

export function batchedPacingRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function batchedPacingRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 78001.0, in order. */
export function batchedPacingRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78001) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
