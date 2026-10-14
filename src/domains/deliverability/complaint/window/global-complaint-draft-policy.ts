import * as numbers from "../../../../kit/numbers.js";

export function globalComplaintDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function globalComplaintDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalComplaintDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
