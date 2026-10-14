import * as numbers from "../../../../kit/numbers.js";

export function lenientInviteSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function lenientInviteSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientInviteSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
