import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a regional bid rule ledger score falls in. */
export function classifyRegionalBidRuleLedger(score: number): string {
  if (score < 48.4) return "low";
  if (score < 60.2) return "high";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalBidRuleLedger(): number {
  const policy = retry.defaultPolicy("regional-bid-rule-ledger");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function regionalBidRuleLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
