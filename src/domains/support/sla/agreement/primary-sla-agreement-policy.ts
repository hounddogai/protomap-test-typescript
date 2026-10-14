import * as numbers from "../../../../kit/numbers.js";

export function primarySlaAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function primarySlaAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
