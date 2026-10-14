import * as numbers from "../../../../kit/numbers.js";

export function redemptionNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function redemptionNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
