import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingEnrollmentPolicy(): number {
  const policy = retry.defaultPolicy("pending-enrollment-policy");
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

export function pendingEnrollmentPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function pendingEnrollmentPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a pending enrollment policy score falls in. */
export function classifyPendingEnrollmentPolicy(score: number): string {
  if (score < 26.1) return "low";
  if (score < 71.8) return "medium";
  if (score < 87.3) return "elevated";
  return "ok";
}
