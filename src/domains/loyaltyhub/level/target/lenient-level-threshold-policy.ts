import * as retry from "../../../../kit/retry.js";

export function lenientLevelThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientLevelThreshold(): number {
  const policy = retry.defaultPolicy("lenient-level-threshold");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a lenient level threshold score falls in. */
export function classifyLenientLevelThreshold(score: number): string {
  if (score < 11.8) return "minimal";
  if (score < 79) return "medium";
  return "high";
}
