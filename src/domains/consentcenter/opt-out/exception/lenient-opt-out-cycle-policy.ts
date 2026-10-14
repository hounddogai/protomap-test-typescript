import * as numbers from "../../../../kit/numbers.js";

export function lenientOptOutCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientOptOutCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function lenientOptOutCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
