import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalPreferenceTier(): number {
  const policy = retry.defaultPolicy("global-preference-tier");
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

export function globalPreferenceTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalPreferenceTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a global preference tier score falls in. */
export function classifyGlobalPreferenceTier(score: number): string {
  if (score < 31.7) return "medium";
  if (score < 49.1) return "critical";
  if (score < 89.5) return "high";
  return "minimal";
}
