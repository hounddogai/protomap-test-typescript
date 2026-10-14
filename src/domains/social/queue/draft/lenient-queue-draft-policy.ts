import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 42804.0, in order. */
export function lenientQueueDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42804) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientQueueDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function lenientQueueDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
