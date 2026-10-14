import * as retry from "../../../../kit/retry.js";

export function regionalReplyRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a regional reply record score falls in. */
export function classifyRegionalReplyRecord(score: number): string {
  if (score < 67.3) return "low";
  if (score < 89) return "elevated";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalReplyRecord(): number {
  const policy = retry.defaultPolicy("regional-reply-record");
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
