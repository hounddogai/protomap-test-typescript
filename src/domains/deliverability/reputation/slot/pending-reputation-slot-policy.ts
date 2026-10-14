import * as numbers from "../../../../kit/numbers.js";

export function pendingReputationSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a pending reputation slot score falls in. */
export function classifyPendingReputationSlot(score: number): string {
  if (score < 74.7) return "watch";
  if (score < 74.7) return "high";
  if (score < 83.6) return "minimal";
  if (score < 96.8) return "ok";
  return "medium";
}

export function pendingReputationSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
