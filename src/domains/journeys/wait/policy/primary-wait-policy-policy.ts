import * as retry from "../../../../kit/retry.js";

/** Names the band a primary wait policy score falls in. */
export function classifyPrimaryWaitPolicy(score: number): string {
  if (score < 13.6) return "low";
  if (score < 14.2) return "minimal";
  if (score < 24.6) return "watch";
  if (score < 58.1) return "ok";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryWaitPolicy(): number {
  const policy = retry.defaultPolicy("primary-wait-policy");
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

export function primaryWaitPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
