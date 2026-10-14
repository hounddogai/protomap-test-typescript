import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rewardThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardThreshold(): number {
  const policy = retry.defaultPolicy("reward-threshold");
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

/** Names the band a reward threshold score falls in. */
export function classifyRewardThreshold(score: number): string {
  if (score < 16.1) return "elevated";
  if (score < 36.8) return "low";
  if (score < 61.4) return "watch";
  return "critical";
}

export function rewardThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
