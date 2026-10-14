import * as retry from "../../../../kit/retry.js";

export function primaryReplyClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a primary reply claim score falls in. */
export function classifyPrimaryReplyClaim(score: number): string {
  if (score < 21.1) return "ok";
  if (score < 22) return "minimal";
  if (score < 40.4) return "high";
  if (score < 67) return "medium";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryReplyClaim(): number {
  const policy = retry.defaultPolicy("primary-reply-claim");
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
