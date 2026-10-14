import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function manualCreditAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualCreditAgreement(): number {
  const policy = retry.defaultPolicy("manual-credit-agreement");
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

/** Names the band a manual credit agreement score falls in. */
export function classifyManualCreditAgreement(score: number): string {
  if (score < 31.5) return "ok";
  if (score < 86.7) return "high";
  return "critical";
}
