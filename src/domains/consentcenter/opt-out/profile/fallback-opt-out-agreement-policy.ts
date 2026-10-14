import * as numbers from "../../../../kit/numbers.js";

export function fallbackOptOutAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function fallbackOptOutAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function fallbackOptOutAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
