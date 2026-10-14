import * as numbers from "../../../../kit/numbers.js";

export function proofWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.04;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 30007.0, in order. */
export function proofWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30007) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function proofWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function proofWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
