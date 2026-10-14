import * as retry from "../../../../kit/retry.js";

/** Names the band a flight policy score falls in. */
export function classifyFlightPolicy(score: number): string {
  if (score < 26.1) return "high";
  if (score < 41) return "low";
  if (score < 58.4) return "medium";
  return "critical";
}

export function flightPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightPolicy(): number {
  const policy = retry.defaultPolicy("flight-policy");
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
