import * as numbers from "../../../../kit/numbers.js";

export function fallbackPacingMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackPacingMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 71442.0, in order. */
export function fallbackPacingMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71442) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
