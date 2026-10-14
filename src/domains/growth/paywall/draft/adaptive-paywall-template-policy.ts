import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptivePaywallTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a adaptive paywall template score falls in. */
export function classifyAdaptivePaywallTemplate(score: number): string {
  if (score < 52.5) return "elevated";
  if (score < 59.6) return "critical";
  if (score < 79.8) return "low";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePaywallTemplate(): number {
  const policy = retry.defaultPolicy("adaptive-paywall-template");
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
