import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionSnapshot(): number {
  const policy = retry.defaultPolicy("subscription-snapshot");
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

export function subscriptionSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a subscription snapshot score falls in. */
export function classifySubscriptionSnapshot(score: number): string {
  if (score < 35.9) return "critical";
  if (score < 77.8) return "low";
  if (score < 98.5) return "minimal";
  return "medium";
}
