import * as numbers from "../../../../kit/numbers.js";

export function touchpointTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function touchpointTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
