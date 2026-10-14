import * as numbers from "../../../../kit/numbers.js";

export function approvalMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function approvalMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
