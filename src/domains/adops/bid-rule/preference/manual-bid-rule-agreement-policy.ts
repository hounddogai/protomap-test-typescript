import * as retry from "../../../../kit/retry.js";

/** Names the band a manual bid rule agreement score falls in. */
export function classifyManualBidRuleAgreement(score: number): string {
  if (score < 6.2) return "low";
  if (score < 70.3) return "minimal";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualBidRuleAgreement(): number {
  const policy = retry.defaultPolicy("manual-bid-rule-agreement");
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
