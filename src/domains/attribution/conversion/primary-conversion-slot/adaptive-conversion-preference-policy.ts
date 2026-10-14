import * as retry from "../../../../kit/retry.js";

export function adaptiveConversionPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveConversionPreference(): number {
  const policy = retry.defaultPolicy("adaptive-conversion-preference");
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

/** Names the band a adaptive conversion preference score falls in. */
export function classifyAdaptiveConversionPreference(score: number): string {
  if (score < 2.3) return "ok";
  if (score < 26.9) return "medium";
  if (score < 56.1) return "high";
  if (score < 63.7) return "critical";
  return "minimal";
}
