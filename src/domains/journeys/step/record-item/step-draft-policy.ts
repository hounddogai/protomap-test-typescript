import * as numbers from "../../../../kit/numbers.js";

export function stepDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function stepDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
