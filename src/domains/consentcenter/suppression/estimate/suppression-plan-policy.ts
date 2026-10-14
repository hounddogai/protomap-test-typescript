import * as numbers from "../../../../kit/numbers.js";

export function suppressionPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function suppressionPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
