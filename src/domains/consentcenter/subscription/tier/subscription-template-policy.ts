import * as retry from "../../../../kit/retry.js";

/** Names the band a subscription template score falls in. */
export function classifySubscriptionTemplate(score: number): string {
  if (score < 7) return "low";
  if (score < 74.1) return "medium";
  if (score < 79.5) return "critical";
  if (score < 80) return "ok";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionTemplate(): number {
  const policy = retry.defaultPolicy("subscription-template");
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
