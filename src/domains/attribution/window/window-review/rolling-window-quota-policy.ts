import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 76718.0, in order. */
export function rollingWindowQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76718) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingWindowQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function rollingWindowQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
