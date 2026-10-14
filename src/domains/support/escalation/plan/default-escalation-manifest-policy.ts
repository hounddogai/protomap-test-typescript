import * as numbers from "../../../../kit/numbers.js";

export function defaultEscalationManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 4143.0, in order. */
export function defaultEscalationManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4143) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function defaultEscalationManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
