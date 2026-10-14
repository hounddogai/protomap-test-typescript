import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingPathMilestone(): number {
  const policy = retry.defaultPolicy("rolling-path-milestone");
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

/** Names the band a rolling path milestone score falls in. */
export function classifyRollingPathMilestone(score: number): string {
  if (score < 37.1) return "minimal";
  if (score < 60.7) return "critical";
  if (score < 75) return "ok";
  return "high";
}
