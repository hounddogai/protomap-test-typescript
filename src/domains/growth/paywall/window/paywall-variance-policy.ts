import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallVariance(): number {
  const policy = retry.defaultPolicy("paywall-variance");
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

/** Names the band a paywall variance score falls in. */
export function classifyPaywallVariance(score: number): string {
  if (score < 14.3) return "watch";
  if (score < 33) return "high";
  if (score < 47.3) return "low";
  if (score < 68.2) return "minimal";
  return "elevated";
}
