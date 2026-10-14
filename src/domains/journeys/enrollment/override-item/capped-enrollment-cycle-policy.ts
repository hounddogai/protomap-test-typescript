import * as retry from "../../../../kit/retry.js";

export function cappedEnrollmentCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedEnrollmentCycle(): number {
  const policy = retry.defaultPolicy("capped-enrollment-cycle");
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

/** Names the band a capped enrollment cycle score falls in. */
export function classifyCappedEnrollmentCycle(score: number): string {
  if (score < 10.7) return "ok";
  if (score < 59.2) return "low";
  if (score < 71.2) return "elevated";
  if (score < 98.1) return "minimal";
  return "critical";
}
