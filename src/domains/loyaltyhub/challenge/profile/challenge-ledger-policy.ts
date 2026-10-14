import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function challengeLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a challenge ledger score falls in. */
export function classifyChallengeLedger(score: number): string {
  if (score < 24.6) return "minimal";
  if (score < 57.4) return "watch";
  if (score < 69.8) return "critical";
  if (score < 89.9) return "low";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeChallengeLedger(): number {
  const policy = retry.defaultPolicy("challenge-ledger");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
