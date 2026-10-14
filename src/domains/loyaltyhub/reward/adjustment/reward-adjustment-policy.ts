import * as retry from "../../../../kit/retry.js";

/** Names the band a reward adjustment score falls in. */
export function classifyRewardAdjustment(score: number): string {
  if (score < 47.3) return "watch";
  if (score < 59.9) return "critical";
  return "medium";
}

export function rewardAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardAdjustment(): number {
  const policy = retry.defaultPolicy("reward-adjustment");
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
