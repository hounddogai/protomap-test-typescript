import * as numbers from "../../../../kit/numbers.js";

export function optOutSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function optOutSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
