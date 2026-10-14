import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightRule(): number {
  const policy = retry.defaultPolicy("flight-rule");
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

/** Names the band a flight rule score falls in. */
export function classifyFlightRule(score: number): string {
  if (score < 7) return "medium";
  if (score < 31.3) return "low";
  if (score < 39.8) return "high";
  if (score < 95.5) return "elevated";
  return "critical";
}

export function flightRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
