import * as numbers from "../../../../kit/numbers.js";

export function pendingBadgeSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending badge slot score falls in. */
export function classifyPendingBadgeSlot(score: number): string {
  if (score < 73.2) return "minimal";
  if (score < 76.7) return "elevated";
  return "low";
}

export function pendingBadgeSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function pendingBadgeSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
