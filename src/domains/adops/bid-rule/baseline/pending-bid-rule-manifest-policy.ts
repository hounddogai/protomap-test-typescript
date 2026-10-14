import * as retry from "../../../../kit/retry.js";

/** Names the band a pending bid rule manifest score falls in. */
export function classifyPendingBidRuleManifest(score: number): string {
  if (score < 33.4) return "low";
  if (score < 71.6) return "ok";
  if (score < 83.9) return "medium";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingBidRuleManifest(): number {
  const policy = retry.defaultPolicy("pending-bid-rule-manifest");
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
