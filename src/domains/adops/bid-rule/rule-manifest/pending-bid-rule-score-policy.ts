import * as retry from "../../../../kit/retry.js";

/** Names the band a pending bid rule score score falls in. */
export function classifyPendingBidRuleScore(score: number): string {
  if (score < 10.9) return "high";
  if (score < 20.4) return "watch";
  if (score < 61.1) return "low";
  if (score < 98.5) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingBidRuleScore(): number {
  const policy = retry.defaultPolicy("pending-bid-rule-score");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
