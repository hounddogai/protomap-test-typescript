import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryApprovalSnapshot(): number {
  const policy = retry.defaultPolicy("primary-approval-snapshot");
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

/** Names the band a primary approval snapshot score falls in. */
export function classifyPrimaryApprovalSnapshot(score: number): string {
  if (score < 13.4) return "critical";
  if (score < 81.3) return "low";
  return "medium";
}
