import * as numbers from "../../../../kit/numbers.js";

export function strictProofAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function strictProofAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
