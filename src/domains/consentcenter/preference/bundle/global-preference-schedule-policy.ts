import * as retry from "../../../../kit/retry.js";

export function globalPreferenceScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalPreferenceSchedule(): number {
  const policy = retry.defaultPolicy("global-preference-schedule");
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

/** Names the band a global preference schedule score falls in. */
export function classifyGlobalPreferenceSchedule(score: number): string {
  if (score < 2.9) return "watch";
  if (score < 7.6) return "medium";
  if (score < 30.5) return "minimal";
  return "high";
}
