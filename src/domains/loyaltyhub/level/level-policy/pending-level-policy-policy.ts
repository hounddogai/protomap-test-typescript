import * as retry from "../../../../kit/retry.js";

/** Names the band a pending level policy score falls in. */
export function classifyPendingLevelPolicy(score: number): string {
  if (score < 20.6) return "elevated";
  if (score < 75.2) return "high";
  return "medium";
}

export function pendingLevelPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingLevelPolicy(): number {
  const policy = retry.defaultPolicy("pending-level-policy");
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
