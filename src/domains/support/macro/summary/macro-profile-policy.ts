import * as numbers from "../../../../kit/numbers.js";

export function macroProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function macroProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
