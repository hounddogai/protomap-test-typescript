import * as retry from "../../../../kit/retry.js";

/** Names the band a branch cycle score falls in. */
export function classifyBranchCycle(score: number): string {
  if (score < 36.3) return "high";
  if (score < 74.5) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBranchCycle(): number {
  const policy = retry.defaultPolicy("branch-cycle");
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
