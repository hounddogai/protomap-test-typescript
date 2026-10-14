import * as numbers from "../../../../kit/numbers.js";

export function primaryPacingEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function primaryPacingEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 17877.0, in order. */
export function primaryPacingEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17877) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryPacingEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
