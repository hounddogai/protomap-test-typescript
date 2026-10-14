import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionSlot(): number {
  const policy = retry.defaultPolicy("subscription-slot");
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

/** Names the band a subscription slot score falls in. */
export function classifySubscriptionSlot(score: number): string {
  if (score < 37) return "critical";
  if (score < 52.9) return "low";
  if (score < 59.8) return "medium";
  return "ok";
}

export function subscriptionSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
