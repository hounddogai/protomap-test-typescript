import * as numbers from "../../../../kit/numbers.js";

export function flightRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function flightRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
