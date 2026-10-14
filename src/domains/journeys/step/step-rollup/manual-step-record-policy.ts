import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualStepRecord(): number {
  const policy = retry.defaultPolicy("manual-step-record");
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

/** Names the band a manual step record score falls in. */
export function classifyManualStepRecord(score: number): string {
  if (score < 3.7) return "watch";
  if (score < 11.1) return "low";
  if (score < 78) return "minimal";
  return "high";
}

export function manualStepRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
