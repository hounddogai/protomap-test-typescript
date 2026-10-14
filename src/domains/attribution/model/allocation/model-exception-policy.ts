import * as numbers from "../../../../kit/numbers.js";

export function modelExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function modelExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function modelExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
