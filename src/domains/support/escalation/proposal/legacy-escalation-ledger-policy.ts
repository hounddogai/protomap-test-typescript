import * as numbers from "../../../../kit/numbers.js";

export function legacyEscalationLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a legacy escalation ledger score falls in. */
export function classifyLegacyEscalationLedger(score: number): string {
  if (score < 43) return "high";
  if (score < 68.5) return "minimal";
  return "watch";
}

export function legacyEscalationLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
