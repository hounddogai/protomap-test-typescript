import * as numbers from "../../../../kit/numbers.js";

export function payoutMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function payoutMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
