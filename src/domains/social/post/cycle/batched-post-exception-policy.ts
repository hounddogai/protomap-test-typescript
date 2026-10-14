import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function batchedPostExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function batchedPostExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a batched post exception score falls in. */
export function classifyBatchedPostException(score: number): string {
  if (score < 30.6) return "high";
  if (score < 72.1) return "minimal";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedPostException(): number {
  const policy = retry.defaultPolicy("batched-post-exception");
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
