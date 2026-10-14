import * as numbers from "../../../../kit/numbers.js";

export function payoutBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function payoutBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
