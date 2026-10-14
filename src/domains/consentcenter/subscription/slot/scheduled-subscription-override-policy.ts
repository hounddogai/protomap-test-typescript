import * as retry from "../../../../kit/retry.js";

export function scheduledSubscriptionOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledSubscriptionOverride(): number {
  const policy = retry.defaultPolicy("scheduled-subscription-override");
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

/** Names the band a scheduled subscription override score falls in. */
export function classifyScheduledSubscriptionOverride(score: number): string {
  if (score < 66.8) return "medium";
  if (score < 92.9) return "watch";
  return "critical";
}
