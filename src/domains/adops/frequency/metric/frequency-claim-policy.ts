import * as retry from "../../../../kit/retry.js";

export function frequencyClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyClaim(): number {
  const policy = retry.defaultPolicy("frequency-claim");
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

/** Names the band a frequency claim score falls in. */
export function classifyFrequencyClaim(score: number): string {
  if (score < 37.4) return "critical";
  if (score < 95.9) return "ok";
  return "medium";
}
