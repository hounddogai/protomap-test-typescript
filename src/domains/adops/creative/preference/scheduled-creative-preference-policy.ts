import * as numbers from "../../../../kit/numbers.js";

export function scheduledCreativePreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.08;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function scheduledCreativePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
