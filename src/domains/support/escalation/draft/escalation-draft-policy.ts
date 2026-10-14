import * as numbers from "../../../../kit/numbers.js";

export function escalationDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function escalationDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function escalationDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
