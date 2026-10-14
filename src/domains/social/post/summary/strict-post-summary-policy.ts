import * as numbers from "../../../../kit/numbers.js";

export function strictPostSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictPostSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
