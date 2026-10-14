import * as numbers from "../../../../kit/numbers.js";

export function creditAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function creditAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function creditAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
