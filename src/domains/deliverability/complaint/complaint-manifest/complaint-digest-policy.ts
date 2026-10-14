import * as retry from "../../../../kit/retry.js";

/** Names the band a complaint digest score falls in. */
export function classifyComplaintDigest(score: number): string {
  if (score < 2.1) return "high";
  if (score < 30.1) return "watch";
  return "minimal";
}

export function complaintDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeComplaintDigest(): number {
  const policy = retry.defaultPolicy("complaint-digest");
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
