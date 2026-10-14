import * as numbers from "../../../../kit/numbers.js";

export function cappedActivationLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function cappedActivationLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function cappedActivationLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a capped activation ledger score falls in. */
export function classifyCappedActivationLedger(score: number): string {
  if (score < 1.3) return "low";
  if (score < 46) return "medium";
  if (score < 48) return "critical";
  if (score < 52.6) return "ok";
  return "high";
}
