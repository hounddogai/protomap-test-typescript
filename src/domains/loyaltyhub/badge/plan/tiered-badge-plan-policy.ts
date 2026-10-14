import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered badge plan score falls in. */
export function classifyTieredBadgePlan(score: number): string {
  if (score < 17.7) return "elevated";
  if (score < 49.2) return "watch";
  if (score < 77.3) return "critical";
  return "high";
}

export function tieredBadgePlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredBadgePlan(): number {
  const policy = retry.defaultPolicy("tiered-badge-plan");
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
