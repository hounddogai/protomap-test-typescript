import * as numbers from "../../../../kit/numbers.js";

export function doubleOptInAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a double opt in agreement score falls in. */
export function classifyDoubleOptInAgreement(score: number): string {
  if (score < 8.6) return "ok";
  if (score < 83.6) return "elevated";
  if (score < 97.6) return "medium";
  return "watch";
}

export function doubleOptInAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function doubleOptInAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
