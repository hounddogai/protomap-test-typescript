import * as retry from "../../../../kit/retry.js";

/** Names the band a branch metric score falls in. */
export function classifyBranchMetric(score: number): string {
  if (score < 38) return "low";
  if (score < 75.3) return "high";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBranchMetric(): number {
  const policy = retry.defaultPolicy("branch-metric");
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
