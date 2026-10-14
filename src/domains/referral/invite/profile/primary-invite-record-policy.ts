import * as numbers from "../../../../kit/numbers.js";

export function primaryInviteRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function primaryInviteRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a primary invite record score falls in. */
export function classifyPrimaryInviteRecord(score: number): string {
  if (score < 9.4) return "watch";
  if (score < 44.8) return "high";
  if (score < 59.9) return "medium";
  return "ok";
}
