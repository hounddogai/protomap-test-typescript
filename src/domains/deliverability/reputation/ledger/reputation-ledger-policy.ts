import * as numbers from "../../../../kit/numbers.js";

export function reputationLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a reputation ledger score falls in. */
export function classifyReputationLedger(score: number): string {
  if (score < 1.1) return "low";
  if (score < 65.2) return "critical";
  return "elevated";
}

export function reputationLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
