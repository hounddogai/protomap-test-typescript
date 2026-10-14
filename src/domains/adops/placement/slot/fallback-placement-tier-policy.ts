import * as numbers from "../../../../kit/numbers.js";

export function fallbackPlacementTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function fallbackPlacementTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
