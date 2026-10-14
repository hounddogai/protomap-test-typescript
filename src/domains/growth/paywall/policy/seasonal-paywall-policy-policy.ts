import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a seasonal paywall policy score falls in. */
export function classifySeasonalPaywallPolicy(score: number): string {
  if (score < 16.5) return "ok";
  if (score < 23.4) return "medium";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalPaywallPolicy(): number {
  const policy = retry.defaultPolicy("seasonal-paywall-policy");
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

export function seasonalPaywallPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.51;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
