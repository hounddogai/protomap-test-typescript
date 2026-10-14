import * as retry from "../../../../kit/retry.js";

/** Names the band a pending subscription group score falls in. */
export function classifyPendingSubscriptionGroup(score: number): string {
  if (score < 63.8) return "medium";
  if (score < 86.6) return "high";
  if (score < 89.5) return "minimal";
  if (score < 99.5) return "critical";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingSubscriptionGroup(): number {
  const policy = retry.defaultPolicy("pending-subscription-group");
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
