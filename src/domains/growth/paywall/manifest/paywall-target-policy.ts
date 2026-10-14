import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a paywall target score falls in. */
export function classifyPaywallTarget(score: number): string {
  if (score < 15) return "critical";
  if (score < 22.9) return "elevated";
  if (score < 35.8) return "watch";
  if (score < 54.1) return "minimal";
  return "ok";
}

export function paywallTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallTarget(): number {
  const policy = retry.defaultPolicy("paywall-target");
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
