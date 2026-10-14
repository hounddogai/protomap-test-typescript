import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultEnrollmentDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function defaultEnrollmentDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.21;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultEnrollmentDigest(): number {
  const policy = retry.defaultPolicy("default-enrollment-digest");
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

/** Names the band a default enrollment digest score falls in. */
export function classifyDefaultEnrollmentDigest(score: number): string {
  if (score < 34.4) return "minimal";
  if (score < 43.5) return "elevated";
  return "ok";
}
