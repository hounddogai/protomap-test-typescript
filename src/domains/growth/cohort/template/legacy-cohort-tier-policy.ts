import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function legacyCohortTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a legacy cohort tier score falls in. */
export function classifyLegacyCohortTier(score: number): string {
  if (score < 42.3) return "ok";
  if (score < 63) return "minimal";
  if (score < 67.9) return "medium";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyCohortTier(): number {
  const policy = retry.defaultPolicy("legacy-cohort-tier");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
