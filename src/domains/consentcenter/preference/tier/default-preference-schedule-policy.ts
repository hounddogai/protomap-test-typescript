import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 94231.0, in order. */
export function defaultPreferenceScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94231) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function defaultPreferenceScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function defaultPreferenceScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
