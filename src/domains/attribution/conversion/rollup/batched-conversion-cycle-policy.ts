import * as numbers from "../../../../kit/numbers.js";

export function batchedConversionCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 19089.0, in order. */
export function batchedConversionCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19089) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedConversionCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function batchedConversionCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
