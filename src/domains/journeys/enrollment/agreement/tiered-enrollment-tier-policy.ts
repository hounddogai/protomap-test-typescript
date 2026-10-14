import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function tieredEnrollmentTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a tiered enrollment tier score falls in. */
export function classifyTieredEnrollmentTier(score: number): string {
  if (score < 57.1) return "low";
  if (score < 96.4) return "watch";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredEnrollmentTier(): number {
  const policy = retry.defaultPolicy("tiered-enrollment-tier");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
