import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalWarmupMilestone(): number {
  const policy = retry.defaultPolicy("global-warmup-milestone");
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

export function globalWarmupMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function globalWarmupMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a global warmup milestone score falls in. */
export function classifyGlobalWarmupMilestone(score: number): string {
  if (score < 30.3) return "low";
  if (score < 33.8) return "critical";
  if (score < 42.7) return "high";
  return "minimal";
}
