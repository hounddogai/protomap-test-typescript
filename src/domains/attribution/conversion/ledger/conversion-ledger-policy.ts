import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function conversionLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a conversion ledger score falls in. */
export function classifyConversionLedger(score: number): string {
  if (score < 17.9) return "critical";
  if (score < 24.6) return "high";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeConversionLedger(): number {
  const policy = retry.defaultPolicy("conversion-ledger");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
